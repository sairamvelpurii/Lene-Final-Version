"""
Train an expense forecasting model using a real personal finance dataset.

Dataset: ml/data/personal_expenses.csv
  - 365+ real transaction records across 12 months
  - 7 categories: Food, Travel, Bills, Entertainment, Healthcare, Shopping, Other
  - Realistic Indian household spending patterns

Model: Random Forest Regressor (scikit-learn)
Target: Predict next month's total expense based on historical patterns

Features engineered per month:
  - month_number (1-12, captures seasonality)
  - total_transactions (spending frequency)
  - avg_transaction (average transaction size)
  - std_transaction (spending volatility)
  - food_ratio, bills_ratio, shopping_ratio (category mix)
  - prev_month_total (lag feature - last month's total)
  - rolling_3m_avg (3-month moving average)
"""

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split


def load_and_prepare_data():
    """Load the personal expenses CSV and engineer monthly features."""
    data_path = Path(__file__).parent / "data" / "personal_expenses.csv"
    if not data_path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {data_path}. "
            "Please ensure ml/data/personal_expenses.csv exists."
        )

    df = pd.read_csv(data_path, parse_dates=["Date"])
    print(f"Loaded {len(df)} transactions from {data_path.name}")
    print(f"Date range: {df['Date'].min().date()} to {df['Date'].max().date()}")
    print(f"Categories: {df['Category'].nunique()} — {sorted(df['Category'].unique())}")
    print(f"Total spend: ₹{df['Amount'].sum():,.2f}")
    print()

    # Create year-month key
    df["YearMonth"] = df["Date"].dt.to_period("M")

    # Aggregate monthly features
    monthly_data = []
    months = sorted(df["YearMonth"].unique())

    for month in months:
        month_df = df[df["YearMonth"] == month]
        total = month_df["Amount"].sum()
        count = len(month_df)
        avg = month_df["Amount"].mean()
        std = month_df["Amount"].std() if len(month_df) > 1 else 0

        # Category ratios
        cat_totals = month_df.groupby("Category")["Amount"].sum()
        food_ratio = cat_totals.get("Food", 0) / total if total > 0 else 0
        bills_ratio = cat_totals.get("Bills", 0) / total if total > 0 else 0
        shopping_ratio = cat_totals.get("Shopping", 0) / total if total > 0 else 0
        travel_ratio = cat_totals.get("Travel", 0) / total if total > 0 else 0
        entertainment_ratio = cat_totals.get("Entertainment", 0) / total if total > 0 else 0

        # Payment mode distribution
        mode_counts = month_df["Payment_Mode"].value_counts(normalize=True)
        upi_ratio = mode_counts.get("UPI", 0)
        credit_ratio = mode_counts.get("Credit Card", 0)

        monthly_data.append({
            "month_number": month.month,
            "total_transactions": count,
            "avg_transaction": round(avg, 2),
            "std_transaction": round(std, 2),
            "food_ratio": round(food_ratio, 4),
            "bills_ratio": round(bills_ratio, 4),
            "shopping_ratio": round(shopping_ratio, 4),
            "travel_ratio": round(travel_ratio, 4),
            "entertainment_ratio": round(entertainment_ratio, 4),
            "upi_ratio": round(upi_ratio, 4),
            "credit_ratio": round(credit_ratio, 4),
            "monthly_total": round(total, 2),
        })

    monthly_df = pd.DataFrame(monthly_data)

    # Add lag features
    monthly_df["prev_month_total"] = monthly_df["monthly_total"].shift(1)
    monthly_df["rolling_3m_avg"] = (
        monthly_df["monthly_total"].rolling(window=3, min_periods=1).mean()
    )

    # Drop first row (no lag available)
    monthly_df = monthly_df.dropna().reset_index(drop=True)

    print("Monthly aggregated features:")
    print(monthly_df.to_string(index=False))
    print()

    return monthly_df


def augment_data(monthly_df, n_augmented=150):
    """
    Augment the dataset by generating realistic variations of existing monthly data.
    This helps Random Forest learn better with limited months of data.
    """
    rng = np.random.default_rng(42)
    augmented_rows = []

    for _ in range(n_augmented):
        # Pick a random existing month as base
        base = monthly_df.sample(1, random_state=rng.integers(0, 100000)).iloc[0]

        noise_factor = rng.uniform(0.85, 1.15)
        small_noise = rng.uniform(0.90, 1.10)

        row = {
            "month_number": rng.integers(1, 13),
            "total_transactions": max(5, int(base["total_transactions"] * rng.uniform(0.7, 1.3))),
            "avg_transaction": base["avg_transaction"] * small_noise,
            "std_transaction": base["std_transaction"] * rng.uniform(0.8, 1.2),
            "food_ratio": np.clip(base["food_ratio"] * small_noise, 0, 1),
            "bills_ratio": np.clip(base["bills_ratio"] * small_noise, 0, 1),
            "shopping_ratio": np.clip(base["shopping_ratio"] * small_noise, 0, 1),
            "travel_ratio": np.clip(base["travel_ratio"] * small_noise, 0, 1),
            "entertainment_ratio": np.clip(base["entertainment_ratio"] * small_noise, 0, 1),
            "upi_ratio": np.clip(base["upi_ratio"] * small_noise, 0, 1),
            "credit_ratio": np.clip(base["credit_ratio"] * small_noise, 0, 1),
            "prev_month_total": base["prev_month_total"] * noise_factor,
            "rolling_3m_avg": base["rolling_3m_avg"] * noise_factor,
            "monthly_total": base["monthly_total"] * noise_factor,
        }
        augmented_rows.append(row)

    augmented_df = pd.DataFrame(augmented_rows)
    combined = pd.concat([monthly_df, augmented_df], ignore_index=True)
    print(f"Augmented dataset: {len(monthly_df)} real + {n_augmented} generated = {len(combined)} total samples")
    return combined


def train_model(df):
    """Train a Random Forest Regressor to predict next month's expense."""
    feature_cols = [
        "month_number",
        "total_transactions",
        "avg_transaction",
        "std_transaction",
        "food_ratio",
        "bills_ratio",
        "shopping_ratio",
        "travel_ratio",
        "entertainment_ratio",
        "upi_ratio",
        "credit_ratio",
        "prev_month_total",
        "rolling_3m_avg",
    ]

    X = df[feature_cols].values
    y = df["monthly_total"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=220,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    print("\n========== Model Evaluation ==========")
    print(f"  R² Score     : {r2:.4f}")
    print(f"  MAE          : ₹{mae:,.2f}")
    print(f"  RMSE         : ₹{rmse:,.2f}")
    print(f"  Train samples: {len(X_train)}")
    print(f"  Test samples : {len(X_test)}")
    print("=======================================\n")

    # Feature importance
    importances = model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    print("Feature Importance Ranking:")
    for rank, idx in enumerate(sorted_idx, 1):
        print(f"  {rank}. {feature_cols[idx]:<25s} {importances[idx]:.4f}")
    print()

    return model, feature_cols, {"r2": r2, "mae": mae, "rmse": rmse}


def main():
    print("=" * 55)
    print("  AI Finance — Expense Forecast Model Training")
    print("  Dataset: ml/data/personal_expenses.csv (Kaggle-style)")
    print("=" * 55)
    print()

    # Step 1: Load and engineer features from real data
    monthly_df = load_and_prepare_data()

    # Step 2: Augment data for better model performance
    training_df = augment_data(monthly_df, n_augmented=150)

    # Step 3: Train Random Forest model
    model, feature_cols, metrics = train_model(training_df)

    # Step 4: Save model and metadata
    out_dir = Path(__file__).parent / "artifacts"
    out_dir.mkdir(parents=True, exist_ok=True)

    model_path = out_dir / "expense_forecast.pkl"
    joblib.dump(model, model_path)
    print(f"Model saved to: {model_path}")

    # Save feature column names for inference
    meta_path = out_dir / "model_metadata.pkl"
    joblib.dump({"feature_cols": feature_cols, "metrics": metrics}, meta_path)
    print(f"Metadata saved to: {meta_path}")
    print("\nDone! Model is ready for predictions.")


if __name__ == "__main__":
    main()
