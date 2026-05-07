"""
FastAPI backend — serves the real pipeline artifacts as JSON for the React dashboard.
Run with:  uvicorn apps.api:app --reload --port 8000
"""
from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

import math
import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from ubid.storage.repository import read_artifact, append_artifact_row
from datetime import datetime

app = FastAPI(title="UBID Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _clean(df: pd.DataFrame) -> list[dict]:
    """Convert DataFrame to JSON-safe list of dicts (replace NaN with None)."""
    return [
        {k: (None if (isinstance(v, float) and math.isnan(v)) else v) for k, v in row.items()}
        for row in df.to_dict(orient="records")
    ]


# ── /api/stats ────────────────────────────────────────────────────────────────
@app.get("/api/stats")
def get_stats():
    linked_df = read_artifact("linked_records")
    decisions_df = read_artifact("link_decisions")
    class_df = read_artifact("activity_classification")
    queue_df = read_artifact("reviewer_queue")

    if linked_df.empty:
        return {"error": "No artifacts found. Run the pipeline first."}

    auto_links = int((decisions_df["decision"] == "AUTO_LINK").sum()) if not decisions_df.empty else 0
    review_pairs = int((decisions_df["decision"] == "REVIEW").sum()) if not decisions_df.empty else 0
    vetoes = int(linked_df["veto_applied"].fillna(False).sum()) if "veto_applied" in linked_df.columns else 0
    ubids = int(linked_df["ubid"].nunique())

    status_counts = {}
    if not class_df.empty and "classification" in class_df.columns:
        status_counts = class_df["classification"].value_counts().to_dict()

    return {
        "sourceRecords": len(linked_df),
        "resolvedUBIDs": ubids,
        "autoLinks": auto_links,
        "reviewPairs": review_pairs,
        "vetoFlags": vetoes,
        "pendingReviews": len(queue_df),
        "statusCounts": status_counts,
    }


# ── /api/activity-trend ───────────────────────────────────────────────────────
@app.get("/api/activity-trend")
def get_activity_trend():
    linked_df = read_artifact("linked_records")
    if linked_df.empty:
        return []

    rows = []
    for dept, color_key in [
        ("shops", "Shops"),
        ("factories", "Factories"),
        ("pollution", "Pollution"),
        ("electricity", "Electricity"),
    ]:
        sub = linked_df[linked_df["source_department"] == dept]
        rows.append({"dept": color_key, "count": len(sub)})

    # Build monthly trend from inspection_dates
    monthly: dict[str, dict[str, int]] = {}
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for _, row in linked_df.iterrows():
        dept = str(row.get("source_department", "")).capitalize()
        dates_raw = str(row.get("inspection_dates", ""))
        for d in dates_raw.split("|"):
            d = d.strip()
            if len(d) >= 7:
                try:
                    month_idx = int(d[5:7]) - 1
                    month_name = months[month_idx]
                    if month_name not in monthly:
                        monthly[month_name] = {}
                    monthly[month_name][dept] = monthly[month_name].get(dept, 0) + 1
                except Exception:
                    pass

    result = []
    for m in months:
        if m in monthly:
            entry = {"name": m}
            entry.update(monthly[m])
            result.append(entry)
    return result


# ── /api/linked-records ───────────────────────────────────────────────────────
@app.get("/api/linked-records")
def get_linked_records(
    department: str = Query(default="All"),
    city: str = Query(default="All"),
    veto: str = Query(default="All"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
):
    df = read_artifact("linked_records")
    if df.empty:
        return {"records": [], "total": 0, "departments": [], "cities": []}

    departments = sorted(df["source_department"].dropna().unique().tolist())
    cities = sorted(df["city"].dropna().unique().tolist())

    if department != "All":
        df = df[df["source_department"] == department]
    if city != "All":
        df = df[df["city"] == city]
    if veto == "Vetoed":
        df = df[df["veto_applied"] == True]
    elif veto == "Clean":
        df = df[df["veto_applied"] != True]

    total = len(df)
    start = (page - 1) * page_size
    end = start + page_size
    page_df = df.iloc[start:end][
        ["ubid", "source_department", "source_id", "name", "pincode", "city",
         "link_confidence", "veto_applied", "veto_reason"]
    ]

    return {
        "records": _clean(page_df),
        "total": total,
        "departments": departments,
        "cities": cities,
    }


# ── /api/reviewer-queue ───────────────────────────────────────────────────────
@app.get("/api/reviewer-queue")
def get_reviewer_queue():
    df = read_artifact("reviewer_queue")
    if df.empty:
        return []
    # Only ambiguous matches (not temporal veto) for the review UI
    ambiguous = df[df["queue_type"] == "Ambiguous match"].copy()
    cols = [c for c in ["queue_type", "left_id", "right_id", "left_name", "right_name",
                         "left_department", "right_department", "confidence",
                         "priority_score", "why_uncertain", "reason", "match_summary"]
            if c in ambiguous.columns]
    return _clean(ambiguous[cols].sort_values("priority_score", ascending=False))


# ── /api/confidence ───────────────────────────────────────────────────────────
@app.get("/api/confidence")
@app.get("/api/link-decisions")
def get_confidence():
    df = read_artifact("link_decisions")
    if df.empty:
        return {"buckets": {}, "records": []}

    buckets = {"Separate (<0.70)": 0, "Review (0.70-0.95)": 0, "Auto-link (≥0.95)": 0}
    for val in df["confidence"]:
        if val < 0.70:
            buckets["Separate (<0.70)"] += 1
        elif val < 0.95:
            buckets["Review (0.70-0.95)"] += 1
        else:
            buckets["Auto-link (≥0.95)"] += 1

    cols = [c for c in ["left_id", "right_id", "left_name", "right_name",
                         "left_department", "right_department", "confidence",
                         "decision", "reason"] if c in df.columns]
    top = df.sort_values("confidence", ascending=False).head(100)
    return {"buckets": buckets, "records": _clean(top[cols])}


# ── /api/lineage ──────────────────────────────────────────────────────────────
@app.get("/api/lineage")
def get_lineage(ubid: str = Query(...)):
    linked_df = read_artifact("linked_records")
    decisions_df = read_artifact("link_decisions")
    class_df = read_artifact("activity_classification")

    lineage = linked_df[linked_df["ubid"] == ubid]
    classification = {}
    if not class_df.empty:
        row = class_df[class_df["ubid"] == ubid]
        if not row.empty:
            classification = row.iloc[0].to_dict()

    pair_audit = []
    if not decisions_df.empty and not lineage.empty:
        source_ids = set(lineage["source_id"].tolist())
        pair_audit = _clean(
            decisions_df[
                decisions_df["left_id"].isin(source_ids) | decisions_df["right_id"].isin(source_ids)
            ]
        )

    cols = [c for c in ["source_department", "source_id", "name", "address",
                         "pan", "gstin", "owner_name", "link_confidence",
                         "veto_applied", "veto_reason"] if c in lineage.columns]
    return {
        "records": _clean(lineage[cols]),
        "classification": {k: (None if isinstance(v, float) and math.isnan(v) else v)
                           for k, v in classification.items()},
        "pairAudit": pair_audit,
    }


# ── /api/ubids ────────────────────────────────────────────────────────────────
@app.get("/api/ubids")
def get_ubids():
    df = read_artifact("linked_records")
    if df.empty:
        return []
    return sorted(df["ubid"].dropna().unique().tolist())


# ── /api/activity ─────────────────────────────────────────────────────────────
@app.get("/api/activity")
def get_activity():
    df = read_artifact("activity_classification")
    if df.empty:
        return {"statusCounts": {}, "records": []}
    status_counts = df["classification"].value_counts().to_dict() if "classification" in df.columns else {}
    return {"statusCounts": status_counts, "records": _clean(df)}


# ── /api/portal/lookup ────────────────────────────────────────────────────────
@app.get("/api/portal/lookup")
def portal_lookup(key: str = Query(...), type: str = Query(default="PAN")):
    df = read_artifact("linked_records")
    class_df = read_artifact("activity_classification")
    if df.empty:
        return {"found": False}

    field = "pan" if type.upper() == "PAN" else "gstin"
    matches = df[df[field].fillna("").astype(str).str.upper() == key.strip().upper()]
    if matches.empty:
        return {"found": False}

    ubid = str(matches["ubid"].iloc[0])
    classification_row = {}
    if not class_df.empty:
        row = class_df[class_df["ubid"] == ubid]
        if not row.empty:
            classification_row = {k: (None if isinstance(v, float) and math.isnan(v) else v)
                                   for k, v in row.iloc[0].to_dict().items()}

    cols = [c for c in ["ubid", "name", "source_department", "pan", "gstin",
                         "address", "city", "owner_name", "link_confidence"] if c in matches.columns]
    return {
        "found": True,
        "ubid": ubid,
        "records": _clean(matches[cols]),
        "classification": classification_row,
    }


# ── /api/portal/feedback ──────────────────────────────────────────────────────
@app.post("/api/portal/feedback")
def portal_feedback(payload: dict):
    append_artifact_row(
        "portal_feedback",
        {
            "submitted_at": datetime.utcnow().isoformat(timespec="seconds"),
            "feedback_type": payload.get("feedback_type", ""),
            "ubid": payload.get("ubid", ""),
            "business_name": payload.get("business_name", ""),
            "contact": payload.get("contact", ""),
            "details": payload.get("details", ""),
            "status": "NEW",
        },
    )
    return {"ok": True}
