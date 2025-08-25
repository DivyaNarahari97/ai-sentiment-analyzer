# AI-Powered Product Review Sentiment Analyzer

A full-stack web application that analyzes customer product reviews and classifies sentiment as **positive, negative, or neutral**.  
Built with **React (frontend)** + **Flask (backend)** and powered by **Hugging Face Transformers, Scikit-learn, and heuristic models**.

---

## ✨ Features

### 🔹 Single Review Analysis
- Real-time prediction as you type (debounced for performance).
- Choose between **Hugging Face (transformer)**, **Scikit-learn (baseline)**, and **Heuristic (keyword)** models.
- Confidence score + donut chart visualization.

### 🔹 Batch CSV Upload
- Upload `.csv` with a `text` column.
- Backend processes all rows and returns predictions.
- Summary stats (counts, top keywords).
- Bar chart visualization + detailed results table.

### 🔹 Model Switcher
- Dropdown in the UI to switch between models:
  - **Hugging Face** → `cardiffnlp/twitter-roberta-base-sentiment-latest`
  - **Scikit-learn** → TF-IDF + Logistic Regression (toy dataset)
  - **Heuristic** → Simple keyword matching
- Sent to backend via `X-Model` header.

---

## 🖥️ Tech Stack

- **Frontend**
  - React + Vite
  - Chart.js (via `react-chartjs-2`)
  - Modern responsive UI

- **Backend**
  - Flask (REST API)
  - Hugging Face Transformers
  - Scikit-learn (TF-IDF + Logistic Regression)
  - Python utilities (csv, regex, Counter)

---

## 📂 Project Structure

ai-sentiment-analyzer/
│
├── backend/
│ ├── app.py # Flask app with ML models
│ ├── requirements.txt # Python dependencies
│ └── .venv1/ # (optional) virtual environment
│
├── frontend/
│ ├── src/
│ │ ├── App.jsx # Main UI
│ │ ├── components/
│ │ │ └── BatchUpload.jsx
│ │ ├── api.js # API helpers
│ │ ├── index.css
│ │ └── main.jsx
│ ├── package.json
│ └── vite.config.js
│
└── README.md



---

# ⚡ Quick Start

## 1️⃣ Backend

```bash
cd backend
python3 -m venv .venv1
source .venv1/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
export API_TOKEN=dev-token
python3 app.py
# Server runs at: http://127.0.0.1:5000


2️⃣ Frontend
cd frontend
npm install
npm run dev
# Frontend runs at: http://127.0.0.1:5173


---

##🔗 API Endpoints
1. Health
curl http://127.0.0.1:5000/api/health
# → {"status": "ok"}

2. Predict
curl -X POST http://127.0.0.1:5000/api/predict \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -H "X-Model: hf" \
  -d '{"text":"I love this!"}'

3. Batch
printf 'text\nLove it\nWorst phone\nOkay product\n' > reviews.csv

curl -X POST http://127.0.0.1:5000/api/batch \
  -H "Authorization: Bearer dev-token" \
  -H "X-Model: sk" \
  -F "file=@reviews.csv"
 

##Screenshots
<img width="770" height="490" alt="image" src="https://github.com/user-attachments/assets/dd3597d6-079e-4926-a480-4f7607411602" />
<img width="767" height="692" alt="image" src="https://github.com/user-attachments/assets/c18ca4a9-f56e-44fd-a439-8a8620bc5cf7" />

Models

Hugging Face

cardiffnlp/twitter-roberta-base-sentiment-latest
Pre-trained transformer for 3-class sentiment (positive / neutral / negative)

Scikit-learn

TF-IDF vectorizer + Logistic Regression
Trained on a small toy dataset (10 positive, 10 neutral, 10 negative)

Heuristic

Rule-based keywords with trigger overrides for edge cases (“hate”, “okay”, etc.)

Future Improvements

Add HF embeddings + Scikit-learn classifier (hybrid model).

Save/load real scikit-learn models (joblib) instead of toy inline training.

Add spinners + error toasts in frontend.

Deploy with Docker + AWS for public demo.

Support multi-language sentiment analysis.

