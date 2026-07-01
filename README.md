# AI Finance Assistant

AI Finance Assistant is a simple full-stack app for tracking personal expenses and understanding spending habits. You can add expenses by hand, upload a bill or bank statement, view charts, and receive practical budget suggestions.

The project uses React for the website, Flask for the API, MongoDB for saved data, and a small machine-learning model for forecasts. The chat assistant can also use Groq when an API key is provided.

## What the app can do

- Create an account and sign in securely
- Add, view, and delete expenses
- Read images and PDFs using OCR
- Extract transactions from some bank statements
- Show category totals and monthly spending trends
- Suggest budgets, savings goals, and next-month estimates
- Answer finance questions through the chat assistant
- Switch between light and dark themes

## How it works

```text
React frontend (Vercel)
        |
        | HTTPS requests
        v
Flask API (Render)
        |
        +---- MongoDB Atlas: users and expenses
        +---- Tesseract: text from bill images
        +---- ML model: expense forecasts
        +---- Groq API: optional finance chat
```

The frontend never connects directly to MongoDB. It sends requests to the Flask API. The API checks the user's JWT token, reads or writes the correct records in MongoDB, and returns JSON to the frontend.

## Project structure

```text
AI-FINANCE-PROJECT/
|-- frontend/              React and Vite website
|   |-- src/components/    Pages, charts, forms, and dashboard parts
|   |-- src/contexts/      Theme state
|   |-- src/api.js         Backend connection
|   `-- vercel.json        Vercel build settings
|-- backend/
|   |-- app.py             Flask routes and finance logic
|   |-- config.py          Groq configuration
|   |-- requirements.txt   Python packages
|   `-- .env.example       Backend environment template
|-- ml/
|   |-- train_model.py     Model training script
|   `-- artifacts/         Trained forecast model
|-- docs/                  Project documentation and diagram
|-- Dockerfile             Production backend image with Tesseract
`-- render.yaml            Render service settings
```

## Run the project locally

### 1. Start MongoDB

Use a local MongoDB server or create a MongoDB Atlas cluster. The default local address is `mongodb://localhost:27017`.

### 2. Start the backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python app.py
```

Open `backend/.env` and replace the example values. The API runs at `http://127.0.0.1:5000`.

Tesseract must be installed on your computer for image OCR. PDF text extraction works through `pdfplumber`.

### 3. Start the frontend

Open another terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The website runs at `http://localhost:5173`.

## Environment variables

Backend variables belong in `backend/.env` locally and in Render's Environment page for production.

| Variable | Purpose |
|---|---|
| `APP_ENV` | Use `development` locally and `production` on Render |
| `SECRET_KEY` | General Flask secret; use a long random value |
| `JWT_SECRET_KEY` | Signs login tokens; use a different random value |
| `MONGO_URI` | MongoDB or MongoDB Atlas connection string |
| `MONGO_DB` | Database name, normally `ai_finance` |
| `FRONTEND_URL` | Frontend URL allowed by CORS; multiple URLs can be comma-separated |
| `UPLOAD_DIR` | Temporary location for uploaded files |
| `ML_MODEL_PATH` | Location of the trained model file |
| `GROQ_API_KEY` | Optional key for live AI chat |

The frontend has one variable:

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Public backend URL, including `/api` |

Do not commit `.env` files. The included `.env.example` files contain safe placeholders and show which values are needed.

## Deploy the app

Deploy in this order: GitHub, MongoDB Atlas, Render, then Vercel.

### 1. Push to GitHub

The `.gitignore` file keeps local environments, secrets, build output, and uploaded documents out of GitHub.

```powershell
git init
git add .
git commit -m "Prepare AI Finance Assistant for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

### 2. Create MongoDB Atlas

Create a cluster, create a database user, and copy the Atlas connection string. Add it to Render as `MONGO_URI`. Also allow network access from the backend host. For a simple first deployment, Atlas permits using `0.0.0.0/0`; use a narrower rule later when your hosting plan provides fixed outbound addresses.

### 3. Deploy the backend on Render

Create a new Blueprint in Render and connect the GitHub repository. Render will read `render.yaml` and build the included Dockerfile. The Docker image includes Tesseract, so uploaded images can be processed.

Enter these secret values when Render asks:

- `MONGO_URI`: the MongoDB Atlas connection string
- `FRONTEND_URL`: the Vercel address; use a temporary expected address at first and update it after Vercel deploys
- `GROQ_API_KEY`: optional

Render creates `SECRET_KEY` and `JWT_SECRET_KEY` automatically. After deployment, check:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/health
```

The response should show `"storage": "mongodb"`.

Uploads are processed in temporary storage. MongoDB keeps the extracted expense data, but the original uploaded document is not permanent. Use object storage such as Cloudinary or Amazon S3 if original files need to be retained.

### 4. Deploy the frontend on Vercel

Import the same GitHub repository into Vercel and choose these settings:

```text
Root Directory: frontend
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

Add this Vercel environment variable:

```env
VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
```

Deploy the site. Copy its final URL into Render's `FRONTEND_URL`, save the setting, and redeploy the backend. Registration, login, dashboard requests, and uploads should now work from the Vercel site.

## API overview

- `GET /api/health` checks the backend and database mode
- `POST /api/auth/register` creates an account
- `POST /api/auth/login` signs in
- `GET /api/auth/me` returns the current user
- `GET/POST/DELETE /api/expenses` manages expenses
- `POST /api/expenses/upload` reads a bill or statement
- `GET /api/analytics/summary` returns chart data
- `GET /api/recommendations` returns forecasts and budget suggestions

Most routes require a JWT token. The frontend adds this token automatically after login.

## A small production note

When `APP_ENV=production`, the backend refuses to start if important secrets or MongoDB settings are missing. It also refuses to silently switch to temporary in-memory data when Atlas is unavailable. This makes configuration problems visible instead of allowing user data to disappear unexpectedly.
