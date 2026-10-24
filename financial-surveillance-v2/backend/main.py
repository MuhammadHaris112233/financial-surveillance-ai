"""Financial Surveillance AI V2 — read-only API for existing synthetic demo datasets.

Place at financial-surveillance-v2/backend/main.py.
This module does not modify existing CSVs, MySQL data, models, or Streamlit code.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any
import math

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).resolve().parents[2]
DEMO = ROOT / "demo_data"

app = FastAPI(title="Financial Surveillance AI — Demo API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=(
        r"^https://[a-zA-Z0-9-]+\.vercel\.app$"
        r"|^http://(localhost|127\.0\.0\.1):517[3-7]$"
    ),
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

REQUIRED = {
    "hybrid_test_results.csv": {"record_id", "trade_id", "asset_class", "reporting_status", "rule_flag", "ml_flag", "hybrid_flag", "detection_source", "anomaly_score"},
    "prioritized_investigations.csv": {"record_id", "trade_id", "risk_score", "risk_priority", "investigation_summary"},
    "ai_investigation_reports.csv": {"record_id", "trade_id", "ai_status", "ai_report"},
}

@lru_cache(maxsize=6)
def _read_csv(filename: str, mtime_ns: int) -> pd.DataFrame:
    df = pd.read_csv(DEMO / filename, keep_default_na=True)
    missing = REQUIRED[filename] - set(df.columns)
    if missing:
        raise ValueError(f"{filename} missing columns: {', '.join(sorted(missing))}")
    if df["record_id"].duplicated().any():
        raise ValueError(f"{filename} contains duplicate record IDs")
    return df


def load(filename: str) -> pd.DataFrame:
    if filename not in REQUIRED:
        raise HTTPException(400, "Unknown dataset")
    path = DEMO / filename
    if not path.is_file():
        raise HTTPException(503, f"Required synthetic dataset unavailable: {filename}")
    try:
        return _read_csv(filename, path.stat().st_mtime_ns)
    except (ValueError, pd.errors.ParserError) as exc:
        raise HTTPException(503, f"Dataset validation failed: {exc}") from exc


def records(df: pd.DataFrame) -> list[dict[str, Any]]:
    # Convert pandas NaN, timestamps and numpy scalars into JSON-compatible values.
    cleaned = df.astype(object).where(pd.notna(df), None)
    return cleaned.to_dict(orient="records")


def bool_col(df: pd.DataFrame, column: str) -> pd.Series:
    return df[column].astype(str).str.strip().str.lower().isin(["true", "1"])


def page(df: pd.DataFrame, limit: int, offset: int) -> dict[str, Any]:
    return {"total": len(df), "limit": limit, "offset": offset, "items": records(df.iloc[offset:offset + limit])}


@app.get("/api/health")
def health():
    return {"status": "healthy", "backend": "FastAPI", "application": "Financial Surveillance AI"}


@app.get("/api/overview")
def overview():
    df = load("hybrid_test_results.csv")
    investigations = load("prioritized_investigations.csv")
    reports = load("ai_investigation_reports.csv")
    rules, ml, hybrid = bool_col(df, "rule_flag"), bool_col(df, "ml_flag"), bool_col(df, "hybrid_flag")
    sources = df.loc[hybrid, "detection_source"].value_counts()
    return {
        "dataset": "independent_synthetic_test",
        "transactions": len(df),
        "unique_hybrid_alerts": int(hybrid.sum()),
        "rule_alerts": int(rules.sum()),
        "ml_alerts": int(ml.sum()),
        "rule_only": int((rules & ~ml).sum()),
        "ml_only": int((ml & ~rules).sum()),
        "rule_and_ml": int((rules & ml).sum()),
        "investigations": len(investigations),
        "ai_reports_available": int((reports["ai_status"] == "SUCCESS").sum()),
        "asset_counts": df["asset_class"].value_counts().to_dict(),
        "detection_sources": sources.to_dict(),
        "risk_priorities": investigations["risk_priority"].value_counts().to_dict(),
        "validation_failures": {key: int(bool_col(df, key).sum()) for key in ["duplicate_trade_id", "missing_counterparty", "invalid_notional", "invalid_currency", "invalid_trade_date"] if key in df},
    }


@app.get("/api/transactions")
def transactions(
    limit: int = Query(25, ge=1, le=200),
    offset: int = Query(0, ge=0),
    search: str = Query("", max_length=100),
    asset_class: str | None = None,
    reporting_status: str | None = None,
    detection_source: str | None = None,
    flagged_only: bool = False,
):
    df = load("hybrid_test_results.csv")
    if search.strip():
        mask = df["trade_id"].astype(str).str.contains(search.strip(), case=False, regex=False, na=False)
        mask |= df["record_id"].astype(str).str.contains(search.strip(), case=False, regex=False, na=False)
        df = df.loc[mask]
    for column, value in [("asset_class", asset_class), ("reporting_status", reporting_status), ("detection_source", detection_source)]:
        if value and value != "ALL":
            df = df.loc[df[column].astype(str).str.upper() == value.upper()]
    if flagged_only:
        df = df.loc[bool_col(df, "hybrid_flag")]
    return page(df, limit, offset)


@app.get("/api/investigations")
def investigations(
    limit: int = Query(25, ge=1, le=200),
    offset: int = Query(0, ge=0),
    search: str = Query("", max_length=100),
    priority: str | None = None,
    detection_source: str | None = None,
):
    df = load("prioritized_investigations.csv")
    if search.strip():
        s = search.strip()
        df = df.loc[df["trade_id"].astype(str).str.contains(s, case=False, regex=False, na=False) | df["record_id"].astype(str).eq(s)]
    if priority and priority != "ALL":
        df = df.loc[df["risk_priority"].astype(str).str.upper() == priority.upper()]
    if detection_source and detection_source != "ALL":
        df = df.loc[df["detection_source"].astype(str).str.upper() == detection_source.upper()]
    df = df.sort_values(["risk_score", "record_id"], ascending=[False, True])
    return page(df, limit, offset)


@app.get("/api/investigations/{record_id}")
def investigation_detail(record_id: int):
    df = load("prioritized_investigations.csv")
    match = df.loc[df["record_id"] == record_id]
    if match.empty:
        raise HTTPException(404, "Investigation not found")
    result = records(match)[0]
    report = load("ai_investigation_reports.csv")
    report_match = report.loc[(report["record_id"] == record_id) & (report["ai_status"] == "SUCCESS")]
    result["ai_report"] = records(report_match)[0]["ai_report"] if not report_match.empty else None
    return result


@app.get("/api/reports")
def reports():
    df = load("ai_investigation_reports.csv")
    return {"total": len(df), "items": records(df)}


@app.get("/api/reports/{record_id}")
def report_detail(record_id: int):
    df = load("ai_investigation_reports.csv")
    match = df.loc[df["record_id"] == record_id]
    if match.empty:
        raise HTTPException(404, "Report not found")
    return records(match)[0]


@app.get("/api/anomaly-distribution")
def anomaly_distribution():
    df = load("hybrid_test_results.csv")
    values = pd.to_numeric(df["anomaly_score"], errors="coerce").dropna()
    if values.empty:
        return {"items": []}
    import numpy as np
    counts, edges = np.histogram(values.to_numpy(), bins=12)
    return {"items": [{"score": round(float((edges[i] + edges[i+1]) / 2), 4), "count": int(counts[i])} for i in range(len(counts))]}
