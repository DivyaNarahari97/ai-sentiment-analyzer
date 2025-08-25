# backend/app.py
import os
import re
import csv, io
from collections import Counter
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# ---------- Hugging Face (optional) ----------
try:
    from transformers.pipelines import pipeline
    HF_AVAILABLE = True
except Exception as e:
    print("[HF] import failed:", e)
    HF_AVAILABLE = False

# ---------- Scikit-learn (optional) ----------
SK_AVAILABLE = False
SK_PIPE = None
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline
    SK_AVAILABLE = True
except Exception as e:
    print("[SK] import failed:", e)
    SK_AVAILABLE = False

load_dotenv()
API_TOKEN = os.getenv("API_TOKEN", "dev-token")
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "5000"))

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ---------- Hugging Face pipeline ----------
HF_CLF = None
HF_MODEL_ID = None
if HF_AVAILABLE:
    try:
        # 3-class model (negative/neutral/positive)
        HF_MODEL_ID = "cardiffnlp/twitter-roberta-base-sentiment-latest"
        HF_CLF = pipeline("sentiment-analysis", model=HF_MODEL_ID)
        print("[HF] pipeline loaded:", HF_MODEL_ID)
    except Exception as e:
        print("[HF] load failed:", e)
        HF_CLF = None

def hf_sentiment(text: str):
    if HF_CLF is None:
        return None
    out = HF_CLF(text)[0]  # e.g. {'label':'negative','score':0.99}
    label = str(out.get("label", "")).lower()
    # normalize variants like POSITIVE/NEGATIVE
    if label not in ("positive", "neutral", "negative"):
        if "pos" in label: label = "positive"
        elif "neu" in label: label = "neutral"
        elif "neg" in label: label = "negative"
    score = float(out.get("score", 0.0))
    return {"label": label, "score": score, "model": "huggingface"}

# ---------- Scikit-learn tiny baseline ----------
def _sk_train_small():
    """
    Train a tiny in-memory model so we have a real sklearn path.
    (For demo only; real apps load a persisted .joblib)
    """
    data = [
        # positive (10)
        "i love this", "amazing quality", "excellent product", "great purchase", "superb device",
        "fantastic phone", "works perfectly", "very satisfied", "happy with it", "wonderful value",
        # neutral (10)
        "it is okay", "average item", "fine for the price", "does the job", "mediocre performance",
        "nothing special", "so so", "neutral feeling", "okay product", "decent overall",
        # negative (10)
        "i hate this", "terrible quality", "worst phone", "broke immediately", "awful experience",
        "very disappointed", "poor build", "waste of money", "horrible device", "not good at all",
    ]
    y = (["positive"]*10) + (["neutral"]*10) + (["negative"]*10)
    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(lowercase=True, ngram_range=(1,2), min_df=1)),
        ("clf", LogisticRegression(max_iter=300))
    ])
    pipe.fit(data, y)
    return pipe

if SK_AVAILABLE:
    try:
        SK_PIPE = _sk_train_small()
        print("[SK] sklearn pipeline trained (toy dataset)")
    except Exception as e:
        print("[SK] training failed:", e)
        SK_PIPE = None

def sk_sentiment(text: str):
    if SK_PIPE is None:
        return None
    try:
        label = SK_PIPE.predict([text])[0]
        # compute confidence if possible
        clf = SK_PIPE.named_steps.get("clf")
        tfidf = SK_PIPE.named_steps.get("tfidf")
        score = 0.75
        if hasattr(clf, "predict_proba") and tfidf is not None:
            probs = clf.predict_proba(tfidf.transform([text]))[0]
            classes = list(clf.classes_)
            score = float(probs[classes.index(label)])
        return {"label": label, "score": score, "model": "sklearn"}
    except Exception as e:
        print("[SK] runtime error:", e)
        return None

# ---------- Heuristic + triggers ----------
def simple_sentiment(text: str):
    t = (text or "").lower()
    words = re.findall(r"[a-z0-9']+", t)
    pos_words = {"good","great","love","amazing","excellent","perfect","outstanding","superb","fantastic","wonderful","like"}
    neg_words = {"bad","terrible","waste","broke","poor","disappoint","awful","horrible","worst","hate","useless","broken","annoying"}
    score = sum(w in pos_words for w in words) - sum(w in neg_words for w in words)
    if score > 0: label = "positive"
    elif score < 0: label = "negative"
    else: label = "neutral"
    conf = 0.5 + 0.1*min(abs(score), 5)
    return {"label": label, "score": float(conf), "model": "heuristic"}

POS_TRIGGERS = {"love","loved","amazing","excellent","awesome","fantastic","great","wonderful","delightful","outstanding","helpful","like"}
NEG_TRIGGERS = {"hate","hated","horrible","terrible","awful","worst","bad","disgusting","useless","broken","waste","annoying"}
NEU_TRIGGERS = {"okay","fine","average","decent","normal","mediocre","moderate","so so","so-so"}

def check_triggers(text: str):
    t = (text or "").lower()
    for w in POS_TRIGGERS:
        if w in t: return "positive"
    for w in NEG_TRIGGERS:
        if w in t: return "negative"
    for w in NEU_TRIGGERS:
        if w in t: return "neutral"
    return None

# ---------- Helpers ----------
def require_token(req):
    auth = req.headers.get("Authorization", "")
    token = auth.replace("Bearer ","").strip()
    return token == API_TOKEN

@app.get("/api/health")
def health():
    return {"status": "ok"}

# choose model; optional per-request override
def choose_model(text: str, override: str | None = None):
    use = (override or os.getenv("USE_MODEL","")).strip().lower()

    def apply_triggers(pred):
        trig = check_triggers(text)
        if trig and pred and trig != pred["label"]:
            # override obvious cases, mark provenance
            return {"label": trig, "score": 0.95, "model": pred["model"] + "+trigger"}
        return pred

    if use == "heuristic":
        return simple_sentiment(text)

    if use == "sk":
        return apply_triggers(sk_sentiment(text) or simple_sentiment(text))

    if use == "hf":
        return apply_triggers(hf_sentiment(text) or simple_sentiment(text))

    # default preference: HF -> SK -> heuristic
    return apply_triggers(hf_sentiment(text) or sk_sentiment(text) or simple_sentiment(text))

# ---------- Tokenization & keywords for batch ----------
STOP = set("""
a an the i you he she it we they this that these those is are was were am be been being
and or but if then else when while to for from in on at with without about into over under
of as by not no yes do does did done have has had having can could would should will
very more most much many few lot lots just only also too so than really
""".split())
TOKENIZE = re.compile(r"[a-z0-9']+")

def tokenize(text: str):
    return [t for t in TOKENIZE.findall((text or "").lower()) if t not in STOP and len(t) > 2]

def keywords_top(texts, k=12):
    c = Counter()
    for t in texts:
        c.update(tokenize(t))
    return [w for w,_ in c.most_common(k)]

# ---------- Routes ----------
@app.post("/api/predict")
def predict():
    if not require_token(request):
        return jsonify({"error": "Unauthorized"}), 401
    body = request.get_json(silent=True) or {}
    text = body.get("text","")
    # model override via header or body
    override = request.headers.get("X-Model") or body.get("model")
    return jsonify(choose_model(text, override))

@app.post("/api/batch")
def batch():
    if not require_token(request):
        return jsonify({"error": "Unauthorized"}), 401
    override = request.headers.get("X-Model")  # <-- was missing
    if 'file' not in request.files:
        return jsonify({"error": "Upload a CSV as form field 'file'"}), 400

    f = request.files['file']
    if not f.filename.lower().endswith('.csv'):
        return jsonify({"error": "Only .csv files are supported"}), 400

    content = f.read().decode('utf-8', errors='ignore')
    reader = csv.DictReader(io.StringIO(content))
    if "text" not in (reader.fieldnames or []):
        return jsonify({"error": "CSV must include a 'text' column"}), 400

    rows = list(reader)
    texts = [r.get("text","") for r in rows]

    preds = [choose_model(t, override) for t in texts]
    out = []
    counts = {"positive":0, "neutral":0, "negative":0}
    for r, p in zip(rows, preds):
        counts[p["label"]] += 1
        out.append({**r, "sentiment": p["label"], "confidence": round(p["score"], 3), "model": p["model"]})

    return jsonify({
        "summary": {
            "total": len(out),
            "counts": counts,
            "keywords": keywords_top(texts, k=12)
        },
        "results": out
    })

@app.get("/api/debug")
def debug_info():
    hf_name = None
    try:
        hf_name = getattr(getattr(HF_CLF, "model", None), "config", None)
        hf_name = getattr(hf_name, "_name_or_path", None)
    except Exception:
        pass
    return {
        "hf_available": bool(HF_AVAILABLE),
        "hf_loaded": HF_CLF is not None,
        "hf_model": hf_name or HF_MODEL_ID,
        "sk_available": bool(SK_AVAILABLE),
        "sk_loaded": SK_PIPE is not None,
        "use_model_env": os.getenv("USE_MODEL", ""),
    }

if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=True)
