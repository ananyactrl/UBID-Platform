from __future__ import annotations

from datetime import datetime
import math

import pandas as pd


HALF_LIVES = {
    "electricity_bill": 90,
    "water_bill": 90,
    "renewal": 180,
    "filing": 180,
    "inspection": 365,
    "closure": 365,
}


def half_life_score(days_since_event: int, half_life_days: int) -> float:
    return math.exp(-days_since_event / half_life_days)


def _parse_events(serialized: str) -> list[tuple[str, pd.Timestamp]]:
    events = []
    for part in str(serialized or "").split("|"):
        if ":" not in part:
            continue
        event_type, date_text = part.split(":", 1)
        try:
            events.append((event_type, pd.to_datetime(date_text)))
        except Exception:
            continue
    return sorted(events, key=lambda item: item[1])


def _ubid_event_table(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for _, row in df.iterrows():
        for event_type, event_date in _parse_events(row.get("event_history", "")):
            rows.append(
                {
                    "ubid": row["ubid"],
                    "event_type": event_type,
                    "event_date": event_date,
                    "source_department": row.get("source_department", ""),
                    "pincode": row.get("pincode", ""),
                    "nic_code": row.get("nic_code", ""),
                    "industry_sector": row.get("industry_sector", ""),
                }
            )
    return pd.DataFrame(rows)


def _cohort_key(df: pd.DataFrame) -> pd.Series:
    return df["pincode"].astype(str) + "|" + df["nic_code"].astype(str)


def run_activity_classification(
    df: pd.DataFrame,
    seed: int | None = None,
    as_of: datetime | None = None,
) -> pd.DataFrame:
    """Classify UBIDs using event recency and pincode + industry cohorts."""
    del seed
    as_of = as_of or datetime(2026, 5, 5)
    events = _ubid_event_table(df)

    if events.empty:
        return pd.DataFrame(
            columns=[
                "ubid",
                "classification",
                "recency_score",
                "events_this_year",
                "cohort_median",
                "last_event_date",
                "evidence_timeline",
                "record_count",
            ]
        )

    profile_rows = []
    for ubid, g in df.groupby("ubid", sort=False):
        ubid_events = events[events["ubid"] == ubid]
        active_events = ubid_events[ubid_events["event_type"] != "closure"]
        last_event_date = active_events["event_date"].max() if not active_events.empty else pd.NaT
        closure_date = ubid_events.loc[ubid_events["event_type"] == "closure", "event_date"].min()
        cohort_pincode = g["pincode"].mode().iloc[0] if not g["pincode"].mode().empty else ""
        cohort_nic = g["nic_code"].mode().iloc[0] if not g["nic_code"].mode().empty else ""
        sector = g["industry_sector"].mode().iloc[0] if "industry_sector" in g and not g["industry_sector"].mode().empty else ""

        recency_score = 0.0
        evidence_bits = []
        for event_type, event_date in ubid_events[["event_type", "event_date"]].itertuples(index=False):
            if event_type == "closure":
                continue
            days = max(0, (as_of - event_date.to_pydatetime()).days)
            score = half_life_score(days, HALF_LIVES.get(event_type, 180))
            recency_score = max(recency_score, score)
        events_this_year = int(
            (
                (ubid_events["event_date"] >= pd.Timestamp(as_of.replace(month=1, day=1)))
                & (ubid_events["event_type"] != "closure")
            ).sum()
        )

        evidence_bits.append(f"{events_this_year} non-closure events in {as_of.year}")
        if pd.notna(last_event_date):
            evidence_bits.append(f"last event {last_event_date.date().isoformat()}")
        if pd.notna(closure_date):
            evidence_bits.append(f"closure reported {closure_date.date().isoformat()}")

        profile_rows.append(
            {
                "ubid": ubid,
                "pincode": cohort_pincode,
                "nic_code": cohort_nic,
                "industry_sector": sector,
                "recency_score": recency_score,
                "events_this_year": events_this_year,
                "last_event_date": last_event_date,
                "closure_date": closure_date,
                "record_count": len(g),
                "evidence_timeline": "; ".join(evidence_bits),
            }
        )

    profiles = pd.DataFrame(profile_rows)
    profiles["cohort_key"] = _cohort_key(profiles)
    cohort_medians = profiles.groupby("cohort_key")["events_this_year"].median().to_dict()
    profiles["cohort_median"] = profiles["cohort_key"].map(cohort_medians).fillna(0).astype(float)

    labels = []
    reasons = []
    for row in profiles.itertuples(index=False):
        last_event_age = 99999
        if pd.notna(row.last_event_date):
            last_event_age = (as_of - row.last_event_date.to_pydatetime()).days

        if pd.notna(row.closure_date) and last_event_age > 0:
            labels.append("CLOSED")
            reasons.append("Closure event exists with no later activity.")
        elif row.recency_score > 0.5:
            labels.append("ACTIVE")
            reasons.append("Recent event recency score is above 0.5.")
        elif row.events_this_year > row.cohort_median:
            labels.append("ACTIVE")
            reasons.append("Events this year exceed similar businesses in same pincode and industry.")
        elif row.events_this_year == 0 and last_event_age > 730:
            labels.append("CLOSED")
            reasons.append("No current-year activity and last event is older than 730 days.")
        else:
            labels.append("DORMANT")
            reasons.append("Activity exists but is below active threshold for its cohort.")

    profiles["classification"] = labels
    profiles["classification_reason"] = reasons
    profiles["recency_score"] = profiles["recency_score"].round(4)
    profiles["last_event_date"] = profiles["last_event_date"].dt.date.astype(str).replace("NaT", "")
    profiles["closure_date"] = profiles["closure_date"].dt.date.astype(str).replace("NaT", "")
    return profiles[
        [
            "ubid",
            "classification",
            "classification_reason",
            "recency_score",
            "events_this_year",
            "cohort_median",
            "last_event_date",
            "closure_date",
            "pincode",
            "nic_code",
            "industry_sector",
            "evidence_timeline",
            "record_count",
        ]
    ]
