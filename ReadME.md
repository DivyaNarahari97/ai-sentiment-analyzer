🎭 AI Sentiment Analyzer

A full-stack web application for real-time and batch sentiment analysis.
Built with React + Vite frontend and a Flask backend, integrated with Hugging Face Transformers, Scikit-learn, and a heuristic rule-based model.

📌 Features

🔹 Frontend (React + Vite)

Responsive, modern UI (textarea, charts, file upload)

Real-time single review analysis with delay/debounce

Batch CSV upload and analysis (counts, keywords, charts)

Model selector (Hugging Face / Scikit-learn / Heuristic)

🔹 Backend (Flask)

RESTful API with /api/health, /api/predict, /api/batch, /api/debug

Hugging Face cardiffnlp/twitter-roberta-base-sentiment-latest

Scikit-learn: TF-IDF + Logistic Regression (toy dataset)

Heuristic rules + keyword triggers for fallback/edge cases

Batch CSV parsing with keyword summary & counts

🔹 Models

Hugging Face: Pre-trained transformer (POS/NEU/NEG)

Scikit-learn: Lightweight ML baseline

Heuristic: Simple keyword-based rules with overrides

⚙️ Installation & Run
1️⃣ Backend (Flask)
cd backend
python3 -m venv .venv1
source .venv1/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
export API_TOKEN=dev-token
python3 app.py


Runs at → http://127.0.0.1:5000

2️⃣ Frontend (React + Vite)
cd frontend
npm install
npm run dev


Runs at → http://127.0.0.1:5173

🔗 API Endpoints
Health
curl http://127.0.0.1:5000/api/health
# → {"status":"ok"}

Predict
curl -X POST http://127.0.0.1:5000/api/predict \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -H "X-Model: hf" \
  -d '{"text":"I love this!"}'

Batch
printf 'text\nLove it\nWorst phone\nOkay product\n' > reviews.csv

curl -X POST "http://127.0.0.1:5000/api/batch?col=text" \
  -H "Authorization: Bearer dev-token" \
  -H "X-Model: sk" \
  -F "file=@reviews.csv"

📊 Screenshots

<img width="772" height="490" alt="image" src="https://github.com/user-attachments/assets/8c7a28b6-873f-4c97-8bd4-b87ab80a4895" />
<img width="757" height="599" alt="image" src="https://github.com/user-attachments/assets/bdba5427-67ea-43ec-901c-8866b76fd038" />



🧠 Models

Hugging Face
cardiffnlp/twitter-roberta-base-sentiment-latest
→ Pre-trained 3-class transformer

Scikit-learn
TF-IDF + Logistic Regression
→ Trained on toy dataset (30 samples)

Heuristic
Rule-based triggers (love, hate, okay, etc.)
→ Fast fallback model

🚀 Future Improvements

 Hybrid model: Hugging Face embeddings + Scikit-learn classifier

 Train and save/load real Scikit-learn models (joblib)

 Loading spinners & error toasts in frontend

 Docker + AWS deployment for public demo

 Multi-language sentiment support

📂 Project Structure
ai-sentiment-analyzer/
├── backend/         # Flask API + models
│   ├── app.py
│   ├── requirements.txt
│   └── ...
├── frontend/        # React + Vite UI
│   ├── src/
│   ├── package.json
│   └── ...
└── README.md
