import json
import os
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

import joblib
import numpy as np
import pdfplumber
import pytesseract
import requests
from PIL import Image
from config import GROQ_API_KEY
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from bson import ObjectId
from pymongo import MongoClient
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

load_dotenv()

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf"}
CATEGORY_KEYWORDS = {
    "Food": ["restaurant", "food", "swiggy", "zomato", "grocery", "cafe"],
    "Travel": ["uber", "ola", "metro", "flight", "travel", "fuel", "petrol"],
    "Bills": ["electricity", "water", "rent", "internet", "bill", "gas"],
    "Entertainment": ["movie", "netflix", "spotify", "game", "entertainment"],
    "Healthcare": ["hospital", "pharmacy", "medicine", "clinic", "health"],
    "Shopping": ["amazon", "flipkart", "store", "shopping"],
    "Other": [],
}


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-that-is-at-least-32-bytes-long")
    app.config["UPLOAD_DIR"] = os.getenv("UPLOAD_DIR", "uploads")
    frontend_url = os.getenv("FRONTEND_URL")
    if frontend_url:
        CORS(app, origins=[frontend_url])
    else:
        CORS(app)
    JWTManager(app)

    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    db_name = os.getenv("MONGO_DB", "ai_finance")
    use_mongo = True
    mem_users = {}
    mem_expenses = []
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2500)
        client.admin.command("ping")
        db = client[db_name]
        users = db.users
        expenses = db.expenses
    except Exception:
        use_mongo = False
        users = None
        expenses = None

    upload_dir = Path(app.config["UPLOAD_DIR"])
    upload_dir.mkdir(parents=True, exist_ok=True)

    model_path = Path(os.getenv("ML_MODEL_PATH", "../ml/artifacts/expense_forecast.pkl"))
    model = joblib.load(model_path) if model_path.exists() else None

    @app.get("/")
    def index():
        return jsonify({
            "message": "LENE Smart Tracker API is running! 🚀",
            "documentation": "Endpoints are available at /api/..."
        })

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "storage": "mongodb" if use_mongo else "in-memory"})

    @app.post("/api/auth/register")
    def register():
        data = request.get_json() or {}
        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        if not (name and email and password):
            return jsonify({"error": "Name, email and password are required"}), 400
        if get_user_by_email(users, mem_users, email, use_mongo):
            return jsonify({"error": "Email already registered"}), 409

        user_doc = {
            "name": name,
            "email": email,
            "password_hash": generate_password_hash(password),
            "created_at": datetime.now(timezone.utc),
        }
        create_user(users, mem_users, user_doc, use_mongo)
        token = create_access_token(identity=email, expires_delta=timedelta(days=1))
        return jsonify({"token": token, "user": {"name": name, "email": email}}), 201

    @app.post("/api/auth/login")
    def login():
        data = request.get_json() or {}
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        user = get_user_by_email(users, mem_users, email, use_mongo)
        if not user or not check_password_hash(user["password_hash"], password):
            return jsonify({"error": "Invalid credentials"}), 401
        token = create_access_token(identity=email, expires_delta=timedelta(days=1))
        return jsonify(
            {"token": token, "user": {"name": user["name"], "email": user["email"]}}
        )

    @app.get("/api/auth/me")
    @jwt_required()
    def me():
        email = get_jwt_identity()
        user = get_user_by_email(users, mem_users, email, use_mongo)
        if user:
            user = {k: v for k, v in user.items() if k != "password_hash"}
        return jsonify(user or {})

    @app.post("/api/expenses")
    @jwt_required()
    def add_expense():
        email = get_jwt_identity()
        data = request.get_json() or {}
        category = data.get("category", "Other")
        amount = float(data.get("amount", 0))
        date_raw = data.get("date")
        note = data.get("note", "")
        if amount <= 0:
            return jsonify({"error": "Amount must be greater than zero"}), 400
        exp_date = datetime.fromisoformat(date_raw) if date_raw else datetime.now(timezone.utc)
        doc = {
            "user_email": email,
            "category": category,
            "amount": amount,
            "date": exp_date,
            "note": note,
            "source": data.get("source", "manual"),
            "type": data.get("type", "expense"),
            "merchant": data.get("merchant", ""),
            "currency": data.get("currency", "INR"),
            "paymentMode": data.get("paymentMode", "Unknown"),
            "receiptImage": data.get("receiptImage", ""),
            "ocrText": data.get("ocrText", ""),
            "confidenceScore": int(data.get("confidenceScore", 0)),
            "items": data.get("items", []),
            "created_at": datetime.now(timezone.utc),
        }
        create_expense(expenses, mem_expenses, doc, use_mongo)
        return jsonify({"message": "Expense added"}), 201

    @app.post("/api/expenses/upload")
    @jwt_required()
    def upload_bill():
        email = get_jwt_identity()
        if "bill" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        file = request.files["bill"]
        if not file.filename:
            return jsonify({"error": "Invalid filename"}), 400
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return jsonify({"error": "Unsupported file type"}), 400

        filename = secure_filename(file.filename)
        save_path = upload_dir / f"{datetime.now(timezone.utc).timestamp()}_{filename}"
        file.save(save_path)

        # Extract text from file
        text = extract_text_from_file(save_path, ext)
        print(f"[UPLOAD] Extracted {len(text)} chars from {ext} file: {filename}")
        print(f"[UPLOAD] First 500 chars: {text[:500]}")

        if not text or len(text.strip()) < 10:
            return jsonify({
                "error": "Could not extract text from the uploaded file. "
                         "Please ensure the image/PDF is clear and contains readable text.",
                "debug_text_length": len(text),
            }), 400

        # Try to extract multiple transactions (bank statement)
        transactions = extract_multiple_transactions(text)

        if transactions and len(transactions) >= 1:
            # Return the extracted transactions for user review
            return jsonify({
                "message": "Extraction successful. Please review before saving.",
                "transaction_count": len(transactions),
                "expenses": transactions,
                "file_path": filename,
                "ocr_text": text
            }), 200
        else:
            # Groq failed or not available — regex fallback for single bill
            print(f"[UPLOAD] Groq multi-txn returned None, falling back to regex")
            extracted = extract_bill_data_from_text(text)
            
            return jsonify({
                "message": "Extraction successful. Please review before saving.",
                "transaction_count": 1,
                "expenses": [
                    {
                        "category": extracted["category"],
                        "amount": extracted["amount"],
                        "date": extracted["date"],
                        "note": extracted["note"],
                        "type": "expense",
                        "merchant": "",
                        "currency": "INR",
                        "paymentMode": "Unknown",
                        "confidenceScore": 50,
                        "items": []
                    }
                ],
                "file_path": filename,
                "ocr_text": text
            }), 200

    @app.get("/api/uploads/<filename>")
    def get_uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_DIR"], filename)

    @app.get("/api/expenses")
    @jwt_required()
    def list_expenses():
        email = get_jwt_identity()
        user_expenses = fetch_user_expenses(expenses, mem_expenses, email, use_mongo, limit=500)
        target_month = request.args.get("month")
        if target_month and target_month != "all":
            user_expenses = [e for e in user_expenses if e.get("date").strftime("%Y-%m") == target_month]
        return jsonify([serialize_expense(e) for e in user_expenses])

    @app.delete("/api/expenses/<expense_id>")
    @jwt_required()
    def delete_expense(expense_id):
        email = get_jwt_identity()
        if use_mongo:
            try:
                result = expenses.delete_one({"_id": ObjectId(expense_id), "user_email": email})
                if result.deleted_count == 0:
                    return jsonify({"error": "Expense not found"}), 404
            except Exception:
                return jsonify({"error": "Invalid expense ID"}), 400
        else:
            idx = next(
                (i for i, e in enumerate(mem_expenses)
                 if e.get("_id") == expense_id and e.get("user_email") == email),
                None,
            )
            if idx is None:
                return jsonify({"error": "Expense not found"}), 404
            mem_expenses.pop(idx)
        return jsonify({"message": "Expense deleted"}), 200

    @app.delete("/api/expenses")
    @jwt_required()
    def delete_all_expenses():
        email = get_jwt_identity()
        if use_mongo:
            result = expenses.delete_many({"user_email": email})
            count = result.deleted_count
        else:
            before = len(mem_expenses)
            mem_expenses[:] = [e for e in mem_expenses if e.get("user_email") != email]
            count = before - len(mem_expenses)
        return jsonify({"message": f"Deleted {count} expenses"}), 200

    @app.get("/api/analytics/summary")
    @jwt_required()
    def analytics_summary():
        email = get_jwt_identity()
        user_expenses = fetch_user_expenses(expenses, mem_expenses, email, use_mongo)
        if not user_expenses:
            return jsonify(
                {
                    "total_spend": 0,
                    "total_income": 0,
                    "by_category": {},
                    "monthly_trend": [],
                    "high_spend_categories": [],
                }
            )
        by_category = {}
        by_month = {}
        total_spend = 0.0
        total_income = 0.0
        target_month = request.args.get("month")
        for exp in user_expenses:
            amount = float(exp["amount"])
            exp_type = exp.get("type", "expense")
            month_key = exp["date"].strftime("%Y-%m")
            
            if exp_type == "expense":
                by_month[month_key] = by_month.get(month_key, 0.0) + amount
            
            if target_month and target_month != "all" and month_key != target_month:
                continue

            if exp_type == "income":
                total_income += amount
            else:
                total_spend += amount
                cat = exp.get("category", "Other")
                by_category[cat] = by_category.get(cat, 0.0) + amount

        sorted_cats = sorted(by_category.items(), key=lambda x: x[1], reverse=True)
        high_spend = [c for c, _ in sorted_cats[:3]]
        return jsonify(
            {
                "total_spend": round(total_spend, 2),
                "total_income": round(total_income, 2),
                "by_category": {k: round(v, 2) for k, v in by_category.items()},
                "monthly_trend": [
                    {"month": k, "amount": round(v, 2)}
                    for k, v in sorted(by_month.items())
                ],
                "high_spend_categories": high_spend,
            }
        )

    @app.get("/api/recommendations")
    @jwt_required()
    def recommendations():
        email = get_jwt_identity()
        user_expenses = fetch_user_expenses(expenses, mem_expenses, email, use_mongo)
        if not user_expenses:
            return jsonify(
                {
                    "predicted_next_month_expense": 0,
                    "recommended_budget": {},
                    "insights": ["Add expenses for at least one month to unlock AI insights."],
                }
            )
        monthly = {}
        monthly_counts = {}
        monthly_cat_totals = {}
        category_totals = {}
        for exp in user_expenses:
            month = exp["date"].strftime("%Y-%m")
            amt = float(exp["amount"])
            monthly[month] = monthly.get(month, 0.0) + amt
            monthly_counts[month] = monthly_counts.get(month, 0) + 1
            cat = exp.get("category", "Other")
            category_totals[cat] = category_totals.get(cat, 0.0) + amt
            if month not in monthly_cat_totals:
                monthly_cat_totals[month] = {}
            monthly_cat_totals[month][cat] = monthly_cat_totals[month].get(cat, 0.0) + amt

        sorted_months = sorted(monthly.keys())
        month_values = [monthly[m] for m in sorted_months]

        # Build features matching the trained model's 13-feature format
        latest_month = sorted_months[-1]
        latest_total = monthly[latest_month]
        latest_count = monthly_counts[latest_month]
        latest_cats = monthly_cat_totals.get(latest_month, {})
        total_for_ratios = latest_total if latest_total > 0 else 1.0

        # Transaction-level stats for latest month
        latest_amounts = [float(e["amount"]) for e in user_expenses
                          if e["date"].strftime("%Y-%m") == latest_month]
        avg_txn = np.mean(latest_amounts) if latest_amounts else 0
        std_txn = np.std(latest_amounts) if len(latest_amounts) > 1 else 0

        # Category ratios
        food_ratio = latest_cats.get("Food", 0) / total_for_ratios
        bills_ratio = latest_cats.get("Bills", 0) / total_for_ratios
        shopping_ratio = latest_cats.get("Shopping", 0) / total_for_ratios
        travel_ratio = latest_cats.get("Travel", 0) / total_for_ratios
        entertainment_ratio = latest_cats.get("Entertainment", 0) / total_for_ratios

        # Lag features
        prev_month_total = month_values[-2] if len(month_values) >= 2 else month_values[-1]
        rolling_3m = np.mean(month_values[-3:]) if len(month_values) >= 3 else np.mean(month_values)

        # Parse month number from latest month (1-12)
        month_num = int(latest_month.split("-")[1])

        features = np.array([[
            month_num,
            latest_count,
            avg_txn,
            std_txn,
            food_ratio,
            bills_ratio,
            shopping_ratio,
            travel_ratio,
            entertainment_ratio,
            0.6,   # upi_ratio estimate
            0.2,   # credit_ratio estimate
            prev_month_total,
            rolling_3m,
        ]], dtype=float)
        predicted_ratio = float(model.predict(features)[0]) if model is not None else 1.0
        predicted = latest_total * predicted_ratio if latest_total > 0 else month_values[-1]
        predicted = max(0, predicted)

        top_cats = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:5]
        total_spent = sum(category_totals.values()) or 1.0
        recommended = {}
        for cat, value in top_cats:
            ratio = value / total_spent
            # trim aggressive spending categories by 5-15%
            cut = 0.85 if cat in {"Entertainment", "Shopping", "Travel"} else 0.95
            recommended[cat] = round(predicted * ratio * cut, 2)
        emergency_fund = round(predicted * 0.1, 2)
        savings = round(predicted * 0.2, 2)

        insights = [
            f"Predicted next month expense is {predicted:.2f}.",
            "Set aside at least 10% as emergency fund.",
            "Target 20% of monthly income toward savings/investments.",
        ]
        heavy_categories = [c for c, _ in top_cats if c in {"Entertainment", "Shopping", "Travel"}]
        if heavy_categories:
            insights.append(
                f"Potential optimization: reduce {', '.join(heavy_categories)} expenses by 10-15%."
            )

        return jsonify(
            {
                "predicted_next_month_expense": round(predicted, 2),
                "recommended_budget": recommended,
                "emergency_fund": emergency_fund,
                "suggested_savings": savings,
                "insights": insights,
            }
        )

    @app.post("/api/chat")
    @jwt_required()
    def chat():
        data = request.get_json() or {}
        message = (data.get("message") or "").strip()
        if not message:
            return jsonify({"error": "Message is required"}), 400

        email = get_jwt_identity()
        user_expenses = fetch_user_expenses(expenses, mem_expenses, email, use_mongo, limit=80)
        finance_context = build_finance_context(user_expenses)
        reply = ask_groq(message, finance_context)
        return jsonify({"reply": reply})

    @app.get("/api/admin/dashboard")
    def admin_dashboard():
        """Admin view to show all stored users and expenses in a visual HTML page."""
        admin_key = os.getenv("ADMIN_KEY")
        if admin_key and request.args.get("key") != admin_key:
            return "Unauthorized", 401
        
        # Fetch all users
        all_users = []
        if use_mongo:
            for u in users.find({}, {"_id": 0, "password_hash": 0}):
                user_data = dict(u)
                if isinstance(user_data.get("created_at"), datetime):
                    user_data["created_at"] = user_data["created_at"].strftime("%Y-%m-%d %H:%M:%S")
                all_users.append(user_data)
        else:
            for email_key, u in mem_users.items():
                all_users.append({"name": u["name"], "email": u["email"],
                    "created_at": u.get("created_at", "N/A")})

        # Fetch all expenses
        all_expenses = []
        if use_mongo:
            for e in expenses.find({}, {"_id": 0}).sort("created_at", -1).limit(200):
                exp = dict(e)
                if isinstance(exp.get("date"), datetime):
                    exp["date"] = exp["date"].strftime("%Y-%m-%d")
                if isinstance(exp.get("created_at"), datetime):
                    exp["created_at"] = exp["created_at"].strftime("%Y-%m-%d %H:%M:%S")
                all_expenses.append(exp)
        else:
            for e in mem_expenses[-200:]:
                exp = dict(e)
                if isinstance(exp.get("date"), datetime):
                    exp["date"] = exp["date"].strftime("%Y-%m-%d")
                if isinstance(exp.get("created_at"), datetime):
                    exp["created_at"] = exp["created_at"].strftime("%Y-%m-%d %H:%M:%S")
                all_expenses.append(exp)

        # Build HTML page
        user_rows = ""
        for i, u in enumerate(all_users, 1):
            user_rows += f"""<tr>
                <td>{i}</td>
                <td>{u.get('name','—')}</td>
                <td>{u.get('email','—')}</td>
                <td>{u.get('created_at','—')}</td>
            </tr>"""

        expense_rows = ""
        for i, e in enumerate(all_expenses, 1):
            expense_rows += f"""<tr>
                <td>{i}</td>
                <td>{e.get('user_email','—')}</td>
                <td>{e.get('category','—')}</td>
                <td style="text-align:right;font-weight:600;">₹{e.get('amount', 0):,.2f}</td>
                <td>{e.get('date','—')}</td>
                <td>{e.get('note','—')}</td>
                <td><span class="badge {e.get('source','')}">{e.get('source','—')}</span></td>
                <td>{e.get('created_at','—')}</td>
            </tr>"""

        storage_type = "MongoDB" if use_mongo else "In-Memory"
        storage_color = "#10b981" if use_mongo else "#f59e0b"

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Finance — Admin Dashboard</title>
    <style>
        * {{ margin:0; padding:0; box-sizing:border-box; }}
        body {{ font-family:'Segoe UI',system-ui,sans-serif; background:#0f172a; color:#e2e8f0; padding:24px; }}
        h1 {{ font-size:28px; background:linear-gradient(135deg,#6366f1,#a855f7); -webkit-background-clip:text;
             -webkit-text-fill-color:transparent; margin-bottom:8px; }}
        .subtitle {{ color:#94a3b8; margin-bottom:32px; }}
        .stats {{ display:flex; gap:16px; margin-bottom:32px; flex-wrap:wrap; }}
        .stat-card {{ background:#1e293b; border:1px solid #334155; border-radius:12px; padding:20px 24px; min-width:180px; }}
        .stat-card .label {{ font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#64748b; margin-bottom:4px; }}
        .stat-card .value {{ font-size:28px; font-weight:700; }}
        .section-title {{ font-size:20px; font-weight:600; margin:32px 0 16px; display:flex; align-items:center; gap:8px; }}
        .section-title span {{ font-size:24px; }}
        table {{ width:100%; border-collapse:collapse; background:#1e293b; border-radius:12px; overflow:hidden; }}
        th {{ background:#334155; padding:12px 16px; text-align:left; font-size:12px; text-transform:uppercase;
             letter-spacing:1px; color:#94a3b8; }}
        td {{ padding:10px 16px; border-bottom:1px solid #1e293b; font-size:14px; }}
        tr:nth-child(even) {{ background:#1e293b; }}
        tr:nth-child(odd) {{ background:#172033; }}
        tr:hover {{ background:#253350; }}
        .badge {{ padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }}
        .badge.manual {{ background:#3b82f620; color:#60a5fa; }}
        .badge.bill_upload {{ background:#10b98120; color:#34d399; }}
        .badge.bank_statement {{ background:#a855f720; color:#c084fc; }}
        .storage-badge {{ display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px;
                         font-weight:600; background:{storage_color}20; color:{storage_color}; }}
        .table-wrap {{ border-radius:12px; overflow-x:auto; border:1px solid #334155; margin-bottom:24px; }}
    </style>
</head>
<body>
    <h1>🔐 AI Finance — Admin Dashboard</h1>
    <p class="subtitle">Backend data storage overview &nbsp; <span class="storage-badge">{storage_type}</span></p>

    <div class="stats">
        <div class="stat-card">
            <div class="label">Total Users</div>
            <div class="value" style="color:#6366f1;">{len(all_users)}</div>
        </div>
        <div class="stat-card">
            <div class="label">Total Expenses</div>
            <div class="value" style="color:#10b981;">{len(all_expenses)}</div>
        </div>
        <div class="stat-card">
            <div class="label">Total Amount</div>
            <div class="value" style="color:#f59e0b;">₹{sum(float(e.get('amount',0)) for e in all_expenses):,.0f}</div>
        </div>
        <div class="stat-card">
            <div class="label">Storage</div>
            <div class="value" style="color:{storage_color};">{storage_type}</div>
        </div>
    </div>

    <div class="section-title"><span>👤</span> Registered Users</div>
    <div class="table-wrap">
        <table>
            <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Registered At</th></tr></thead>
            <tbody>{user_rows if user_rows else '<tr><td colspan="4" style="text-align:center;color:#64748b;">No users yet</td></tr>'}</tbody>
        </table>
    </div>

    <div class="section-title"><span>💰</span> All Expenses (Latest 200)</div>
    <div class="table-wrap">
        <table>
            <thead><tr><th>#</th><th>User</th><th>Category</th><th>Amount</th><th>Date</th><th>Note</th><th>Source</th><th>Created</th></tr></thead>
            <tbody>{expense_rows if expense_rows else '<tr><td colspan="8" style="text-align:center;color:#64748b;">No expenses yet</td></tr>'}</tbody>
        </table>
    </div>
</body>
</html>"""
        return html, 200, {"Content-Type": "text/html"}

    @app.post("/api/debug/ocr")
    @jwt_required()
    def debug_ocr():
        """Debug endpoint to test OCR + Groq extraction without saving expenses."""
        if "bill" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        file = request.files["bill"]
        if not file.filename:
            return jsonify({"error": "Invalid filename"}), 400
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return jsonify({"error": "Unsupported file type"}), 400

        filename = secure_filename(file.filename)
        save_path = upload_dir / f"debug_{datetime.now(timezone.utc).timestamp()}_{filename}"
        file.save(save_path)

        # Step 1: OCR
        text = extract_text_from_file(save_path, ext)

        # Step 2: Multi-transaction extraction
        transactions = extract_multiple_transactions(text)

        # Step 3: Single-bill fallback
        single_bill = extract_bill_data_from_text(text)
        if isinstance(single_bill.get("date"), datetime):
            single_bill["date"] = single_bill["date"].isoformat()

        # Cleanup
        try:
            save_path.unlink()
        except Exception:
            pass

        return jsonify({
            "ocr_text_length": len(text),
            "ocr_text_preview": text[:2000],
            "ocr_text_full": text,
            "groq_api_key_set": bool(GROQ_API_KEY and GROQ_API_KEY != "YOUR_API_KEY_HERE"),
            "multi_transactions": [
                {"amount": t["amount"], "description": t.get("description"), "category": t.get("category"),
                 "date": t["date"].isoformat() if isinstance(t.get("date"), datetime) else str(t.get("date", ""))}
                for t in (transactions or [])
            ],
            "multi_transaction_count": len(transactions) if transactions else 0,
            "single_bill_fallback": single_bill,
        })

    return app


def extract_text_from_file(path: Path, ext: str) -> str:
    """Extract raw text from an image or PDF file.
    
    For PDFs: uses pdfplumber (pure Python, always works).
    For images: tries pytesseract first, falls back gracefully if Tesseract
    binary is not installed (common on Render/cloud deployments).
    """
    text = ""
    if ext == "pdf":
        try:
            with pdfplumber.open(path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    text += page_text + "\n"
                    # Also try extracting from tables if regular extraction is sparse
                    if len(page_text.strip()) < 50:
                        tables = page.extract_tables()
                        for table in tables:
                            for row in table:
                                row_text = "  ".join(str(cell) for cell in row if cell)
                                text += row_text + "\n"
            print(f"[OCR] PDF extracted {len(text)} chars from {path.name}")
        except Exception as e:
            print(f"[OCR] PDF extraction error: {type(e).__name__}: {e}")
    else:
        # Image file — try pytesseract
        try:
            img = Image.open(path)
            text = pytesseract.image_to_string(img)
            print(f"[OCR] Tesseract extracted {len(text)} chars from {path.name}")
        except Exception as e:
            print(f"[OCR] Tesseract failed ({type(e).__name__}: {e}), trying Groq vision fallback...")
            # Fallback: use Groq to describe the image if pytesseract is unavailable
            text = _ocr_image_via_groq(path)
    return text


def _ocr_image_via_groq(path: Path) -> str:
    """Fallback OCR: send the image to Groq and ask it to extract all visible text.
    This works when Tesseract is not installed (e.g. on Render).
    Uses base64 encoding to send the image inline.
    """
    if not GROQ_API_KEY or GROQ_API_KEY == "YOUR_API_KEY_HERE":
        print("[OCR] No Groq API key available for image fallback")
        return ""

    try:
        import base64
        with open(path, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode("utf-8")

        # Determine MIME type
        ext = path.suffix.lower().lstrip(".")
        mime_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png"}
        mime = mime_map.get(ext, "image/jpeg")

        payload = {
            "model": "llama-3.2-90b-vision-preview",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an OCR assistant. The user will provide an image of a bill, receipt, "
                        "bank statement, or financial document. Extract ALL visible text from the image "
                        "exactly as it appears — preserve numbers, dates, amounts, descriptions, and formatting. "
                        "Do not summarize or interpret. Just output the raw text."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract all text from this financial document image:"},
                        {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{img_b64}"}},
                    ],
                },
            ],
            "temperature": 0,
            "max_tokens": 3000,
        }
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=30,
        )
        if response.status_code != 200:
            print(f"[OCR] Groq vision fallback error {response.status_code}: {response.text[:200]}")
            return ""

        text = response.json()["choices"][0]["message"]["content"].strip()
        print(f"[OCR] Groq vision fallback extracted {len(text)} chars")
        return text

    except Exception as e:
        print(f"[OCR] Groq vision fallback error: {type(e).__name__}: {e}")
        return ""


def extract_multiple_transactions(text: str):
    """
    Use Groq AI to extract ALL transactions from the document text.
    Returns a list of transaction dicts, or None if Groq is unavailable/fails.
    """
    if not GROQ_API_KEY or GROQ_API_KEY == "YOUR_API_KEY_HERE":
        print("[MULTI-TXN] No Groq API key, skipping AI extraction")
        return None

    if not text or len(text.strip()) < 10:
        print("[MULTI-TXN] Text too short for extraction")
        return None

    try:
        # Send up to 6000 chars (increased from 4000) — covers most statements
        text_chunk = text[:6000]
        print(f"[MULTI-TXN] Sending {len(text_chunk)} chars to Groq")

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a financial document parser. Your job is to extract EVERY individual "
                        "transaction from the given text.\n\n"
                        "The text may be from a bank statement, credit card statement, UPI history, "
                        "bill, receipt, or any financial document.\n\n"
                        "Extract EACH transaction as a separate entry. Intelligently differentiate "
                        "between incomes (deposits, credits, additions, salary) and "
                        "expenses (withdrawals, debits, deductions, payments, purchases).\n\n"
                        "Reply with ONLY a valid JSON array. Each object must have:\n"
                        '- "merchant": Name of the merchant or description (e.g. "Swiggy", "Salary")\n'
                        '- "amount": The absolute positive amount (e.g., 1500.00)\n'
                        '- "currency": Currency code (e.g., "INR", "USD")\n'
                        '- "date": The transaction date in "YYYY-MM-DD" format (use today if not found)\n'
                        '- "category": one of: Food, Travel, Bills, Entertainment, Healthcare, Shopping, Other (for expenses), or Salary, Refund, Investment, Other (for incomes)\n'
                        '- "type": exactly "income" or "expense"\n'
                        '- "paymentMode": e.g., "UPI", "Credit Card", "Cash", "Bank Transfer", "Unknown"\n'
                        '- "items": array of strings (e.g., ["Pizza", "Coke"]) if applicable, else []\n'
                        '- "confidenceScore": integer 0-100 indicating your confidence in this extraction\n\n'
                        "If you cannot find ANY transaction data at all, reply with: []\n\n"
                        "CRITICAL RULES:\n"
                        "- Reply with ONLY the JSON array\n"
                        "- No markdown code fences, no explanation, no extra text\n"
                        "- Every transaction must be its own object in the array\n"
                        "- Amount must be a plain positive number\n"
                    ),
                },
                {
                    "role": "user",
                    "content": f"Extract every individual transaction from this document:\n\n{text_chunk}",
                },
            ],
            "temperature": 0,
            "max_tokens": 4000,
        }
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=45,
        )
        if response.status_code != 200:
            print(f"[MULTI-TXN] Groq error {response.status_code}: {response.text[:300]}")
            return None

        reply = response.json()["choices"][0]["message"]["content"].strip()
        print(f"[MULTI-TXN] Groq raw reply ({len(reply)} chars): {reply[:500]}")

        # Clean up the reply — remove markdown code fences if present
        cleaned = reply
        if "```" in cleaned:
            cleaned = re.sub(r"```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```", "", cleaned)
            cleaned = cleaned.strip()

        # Try to extract JSON array from the response even if there's extra text
        # Find the first '[' and last ']'
        start_idx = cleaned.find("[")
        end_idx = cleaned.rfind("]")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            cleaned = cleaned[start_idx:end_idx + 1]

        transactions_raw = json.loads(cleaned)

        if not isinstance(transactions_raw, list) or len(transactions_raw) == 0:
            print("[MULTI-TXN] Groq returned empty array")
            return None

        # Parse and validate each transaction
        transactions = []
        for txn in transactions_raw:
            try:
                # Handle amount — could be string or number
                raw_amount = txn.get("amount", 0)
                if isinstance(raw_amount, str):
                    raw_amount = re.sub(r"[₹$€£,\s]", "", raw_amount)
                amount = float(raw_amount)
                if amount <= 0:
                    continue

                # Parse date
                date_str = txn.get("date", "")
                txn_date = None
                for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y"):
                    try:
                        txn_date = datetime.strptime(date_str, fmt)
                        break
                    except (ValueError, TypeError):
                        continue
                if txn_date is None:
                    txn_date = datetime.now(timezone.utc)

                description = txn.get("description", "Transaction")
                category = txn.get("category", "Other")

                txn_type = txn.get("type", "expense")

                # Validate category
                valid_cats = {"Food", "Travel", "Bills", "Entertainment", "Healthcare", "Shopping", "Salary", "Refund", "Investment", "Other"}
                if category not in valid_cats:
                    category = infer_category(description)

                transactions.append({
                    "amount": amount,
                    "date": txn_date,
                    "description": description,
                    "category": category,
                    "type": txn_type,
                })
            except (ValueError, TypeError) as te:
                print(f"[MULTI-TXN] Skipping bad transaction: {te}")
                continue

        if len(transactions) >= 1:
            print(f"[MULTI-TXN] ✅ Extracted {len(transactions)} transactions")
            return transactions

        print("[MULTI-TXN] No valid transactions after validation")
        return None

    except json.JSONDecodeError as e:
        print(f"[MULTI-TXN] JSON parse error: {e}")
        print(f"[MULTI-TXN] Raw reply was: {reply[:500] if 'reply' in locals() else 'N/A'}")
        return None
    except Exception as e:
        print(f"[MULTI-TXN] Error: {type(e).__name__}: {e}")
        return None


def extract_bill_data_from_text(text: str):
    """Extract a single bill's data from pre-extracted text."""
    amount = extract_amount_with_ai(text)
    date = extract_date(text) or datetime.now(timezone.utc)
    category = infer_category(text)
    return {
        "amount": amount,
        "date": date,
        "category": category,
        "note": "Auto-extracted from bill",
    }


def extract_bill_data(path: Path, ext: str):
    text = extract_text_from_file(path, ext)
    return extract_bill_data_from_text(text)


def extract_amount_with_ai(text: str) -> float:
    """Use Groq LLM to intelligently extract the total bill amount from OCR text."""
    if not GROQ_API_KEY or GROQ_API_KEY == "YOUR_API_KEY_HERE":
        return extract_amount_regex(text)

    try:
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a bill/receipt data extraction assistant. "
                        "The user will provide raw text extracted from a bill, receipt, invoice, or payment screenshot. "
                        "Your ONLY job is to find the TOTAL / FINAL amount that was paid or is payable. "
                        "Look for keywords like: Total, Grand Total, Net Amount, Amount Payable, Amount Paid, "
                        "Total Amount, Net Payable, Bill Amount, Final Amount, Debit, Debited, Paid, Balance Due. "
                        "Ignore subtotals, tax breakdowns, phone numbers, account numbers, transaction IDs, "
                        "dates, invoice numbers, GST numbers, and any other non-amount numbers. "
                        "Reply with ONLY a single number (the total amount). No currency symbols, no commas, "
                        "no text, no explanation. Just the number. Example: 1250.00"
                    ),
                },
                {
                    "role": "user",
                    "content": f"Extract the total bill amount from this text:\n\n{text[:3000]}",
                },
            ],
            "temperature": 0,
            "max_tokens": 30,
        }
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15,
        )
        response.raise_for_status()
        reply = response.json()["choices"][0]["message"]["content"].strip()

        # Parse the number from the AI response
        # Remove any stray currency symbols, commas, spaces
        cleaned_reply = re.sub(r"[₹$€£,\s]", "", reply)
        # Extract just the numeric part
        match = re.search(r"(\d+(?:\.\d{1,2})?)", cleaned_reply)
        if match:
            amount = float(match.group(1))
            if 0 < amount <= 10_000_000:  # sanity check
                return amount

    except Exception:
        pass  # Fall back to regex extraction

    return extract_amount_regex(text)


def extract_amount_regex(text: str) -> float:
    """Improved regex-based extraction that focuses on total/final amounts."""
    MAX_REASONABLE = 1_000_000

    # Normalize: remove commas from numbers (handles 1,234.56 and Indian 1,23,456)
    cleaned = re.sub(r"(\d),(\d)", r"\1\2", text)

    # Remove phone numbers (10+ digit sequences, or patterns like +91-xxx)
    cleaned = re.sub(r"\+?\d{1,3}[-.\s]?\d{10,}", "", cleaned)
    cleaned = re.sub(r"\b\d{10,}\b", "", cleaned)

    # Remove common non-amount patterns (dates, IDs, GST, account numbers)
    cleaned = re.sub(r"\b\d{2}[/-]\d{2}[/-]\d{2,4}\b", "", cleaned)  # dates
    cleaned = re.sub(r"\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d][A-Z]\d{3}\b", "", cleaned)  # GST
    cleaned = re.sub(r"(?:A/C|ACCT|Account)\s*(?:No\.?)?\s*:?\s*\d+", "", cleaned, flags=re.I)

    # Priority 1: Total / Grand Total / Net Amount / Amount Payable patterns
    # These are the most reliable indicators of the final amount
    total_patterns = [
        r"(?:grand\s*total|total\s*amount|net\s*(?:amount|payable)|amount\s*(?:payable|paid|due)|bill\s*amount|final\s*amount|balance\s*due)\s*[:\-=]?\s*(?:(?:rs\.?|₹|inr)\s*)?(\d+(?:\.\d{1,2})?)",
        r"(?:rs\.?|₹|inr)\s*[:\-]?\s*(\d+(?:\.\d{1,2})?)\s*(?:total|paid|payable)",
    ]
    for pat in total_patterns:
        matches = re.findall(pat, cleaned, re.I)
        if matches:
            amounts = [float(m) for m in matches if 0 < float(m) <= MAX_REASONABLE]
            if amounts:
                return max(amounts)

    # Priority 2: Simple "Total" keyword (most common on receipts)
    total_simple = re.findall(
        r"(?:total|paid|debited|credited)\s*[:\-=]?\s*(?:(?:rs\.?|₹|inr)\s*)?(\d+(?:\.\d{1,2})?)",
        cleaned, re.I
    )
    if total_simple:
        amounts = [float(m) for m in total_simple if 0 < float(m) <= MAX_REASONABLE]
        if amounts:
            return max(amounts)

    # Priority 3: Currency symbol followed by amount
    currency_amounts = re.findall(
        r"(?:rs\.?|₹|inr)\s*[:\-]?\s*(\d+(?:\.\d{1,2})?)", cleaned, re.I
    )
    if currency_amounts:
        amounts = [float(m) for m in currency_amounts if 0 < float(m) <= MAX_REASONABLE]
        if amounts:
            return max(amounts)

    # Priority 4: Last resort — find all decimal numbers, pick the largest reasonable one
    all_nums = re.findall(r"\b(\d{1,7}(?:\.\d{1,2})?)\b", cleaned)
    plausible = [float(n) for n in all_nums if 1 <= float(n) <= MAX_REASONABLE]
    if plausible:
        return max(plausible)

    return 0.0


def extract_date(text: str):
    patterns = [r"(\d{4}-\d{2}-\d{2})", r"(\d{2}/\d{2}/\d{4})", r"(\d{2}-\d{2}-\d{4})"]
    for p in patterns:
        m = re.search(p, text)
        if m:
            raw = m.group(1)
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
                try:
                    return datetime.strptime(raw, fmt)
                except ValueError:
                    continue
    return None


def infer_category(text: str) -> str:
    t = text.lower()
    for category, words in CATEGORY_KEYWORDS.items():
        if any(w in t for w in words):
            return category
    return "Other"


def serialize_expense(expense_doc: dict):
    data = dict(expense_doc)
    # Convert MongoDB ObjectId to string for JSON serialization
    if "_id" in data:
        data["_id"] = str(data["_id"])
    if isinstance(data.get("date"), datetime):
        data["date"] = data["date"].date().isoformat()
    if isinstance(data.get("created_at"), datetime):
        data["created_at"] = data["created_at"].isoformat()
    # Ensure file_path is a string
    if isinstance(data.get("file_path"), Path):
        data["file_path"] = str(data["file_path"])
    return data


def get_user_by_email(users, mem_users: dict, email: str, use_mongo: bool):
    if use_mongo:
        return users.find_one({"email": email})
    return mem_users.get(email)


def create_user(users, mem_users: dict, user_doc: dict, use_mongo: bool):
    if use_mongo:
        users.insert_one(user_doc)
    else:
        mem_users[user_doc["email"]] = dict(user_doc)


def create_expense(expenses, mem_expenses: list, expense_doc: dict, use_mongo: bool):
    if use_mongo:
        expenses.insert_one(expense_doc)
    else:
        mem_expenses.append(dict(expense_doc))


def fetch_user_expenses(expenses, mem_expenses: list, email: str, use_mongo: bool, limit=None):
    if use_mongo:
        query = expenses.find({"user_email": email}).sort("date", -1)
        return list(query.limit(limit)) if limit else list(query)
    data = [e for e in mem_expenses if e.get("user_email") == email]
    data.sort(key=lambda x: x.get("date", datetime.now(timezone.utc)), reverse=True)
    return data[:limit] if limit else data


def build_finance_context(user_expenses: list):
    if not user_expenses:
        return "No expense data found for this user yet."
    totals = {}
    monthly = {}
    for item in user_expenses:
        amount = float(item.get("amount", 0))
        category = item.get("category", "Other")
        totals[category] = totals.get(category, 0) + amount
        month = item.get("date", datetime.now(timezone.utc)).strftime("%Y-%m")
        monthly[month] = monthly.get(month, 0) + amount
    top = sorted(totals.items(), key=lambda x: x[1], reverse=True)[:4]
    return (
        f"Top spend categories: {top}. "
        f"Recent monthly totals: {sorted(monthly.items())[-6:]}. "
        "Advise conservatively and provide practical actions."
    )


def ask_groq(message: str, finance_context: str):
    if not GROQ_API_KEY or GROQ_API_KEY == "YOUR_API_KEY_HERE":
        return (
            "Groq API key is not configured yet. Add GROQ_API_KEY in backend/.env to enable live AI chat. "
            "For now, reduce high-variance categories by 10%, automate savings on salary day, and cap discretionary spending."
        )

    try:
        system_prompt = (
            "You are an expert personal finance coach and budgeting assistant. "
            "You help users understand their spending, suggest savings strategies, "
            "create budgets, and provide actionable financial advice. "
            "Keep answers concise, action-oriented, and realistic. "
            "Use bullet points when listing recommendations. "
            "If the user asks about their spending data, use the financial snapshot below.\n\n"
            f"User financial snapshot: {finance_context}"
        )
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            "temperature": 0.3,
            "max_tokens": 500,
        }
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=25,
        )
        if response.status_code != 200:
            error_detail = response.text[:200]
            print(f"[GROQ ERROR] Status {response.status_code}: {error_detail}")
            return f"AI service returned an error (status {response.status_code}). Please try again in a moment."

        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except requests.exceptions.Timeout:
        return "The AI service is taking too long to respond. Please try again shortly."
    except requests.exceptions.ConnectionError:
        return "Could not connect to the AI service. Please check your internet connection."
    except Exception as e:
        print(f"[GROQ ERROR] Unexpected: {type(e).__name__}: {e}")
        return (
            "I could not reach the AI service right now. As a fallback, use a 50/30/20 budget, "
            "set weekly category limits, and prioritize an emergency fund equal to 3-6 months of core expenses."
        )


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
else:
    # For gunicorn / production WSGI servers: `gunicorn app:app`
    app = create_app()
