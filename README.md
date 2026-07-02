# AI-Driven Financial Planning and Budgeting Assistant

Full-stack application built with React + Flask + MongoDB + Scikit-learn to help users track expenses, analyze spending patterns, and get AI-powered budget recommendations.

## Features Implemented

- Secure user authentication (register/login with JWT)
- Personalized dashboard
- Manual expense tracking (category, amount, date, note)
- Bill upload (image/PDF) with OCR/text extraction and auto-expense creation
- AI-based analytics:
  - Category-wise spend analysis
  - Monthly trend analysis
  - High-spend category detection
- ML-driven recommendations:
  - Next month expense prediction
  - Category budget recommendation
  - Emergency fund and savings suggestions
- Interactive charts (pie, line, bar)

## Tech Stack

- Frontend: React (Vite), Recharts, Axios
- Backend: Flask, Flask-JWT-Extended, PyMongo
- Database: MongoDB
- AI/ML: Scikit-learn RandomForestRegressor
- Bill extraction: `pdfplumber` + `pytesseract`

## Project Structure

- `backend/` Flask API
- `frontend/` React app
- `ml/` model training and artifacts

## Setup

### 1) Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python app.py
```

Backend runs on `http://localhost:5000`.

### 2) Train ML Model

```bash
cd ml
python -m venv .venv
.venv\Scripts\activate
pip install scikit-learn numpy joblib
python train_model.py
```

This generates `ml/artifacts/expense_forecast.pkl`.

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/expenses`
- `POST /api/expenses/upload`
- `GET /api/expenses`
- `GET /api/analytics/summary`
- `GET /api/recommendations`

## Notes

- For OCR with images, install Tesseract OCR binary and ensure it is in PATH.
- Bill parsing logic is intentionally lightweight and can be replaced with advanced NLP pipelines.
