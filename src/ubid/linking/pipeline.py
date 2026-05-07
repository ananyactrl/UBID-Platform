from __future__ import annotations

from collections import defaultdict
from itertools import combinations
import math
import re

import jellyfish
import networkx as nx
import pandas as pd
from rapidfuzz.distance import JaroWinkler


PREFIXES = {"m/s", "m/s.", "sri", "shri"}
SUFFIXES = {"pvt", "ltd", "llp", "private", "limited", "traders", "enterprises"}

WEIGHTS = {
    "pan": 0.35,
    "gstin": 0.30,
    "name": 0.15,
    "address": 0.10,
    "pincode": 0.05,
    "phonetic": 0.05,
}

AUTO_LINK_THRESHOLD = 0.95
REVIEW_THRESHOLD = 0.70


def _norm_text(value: str) -> str:
    text = re.sub(r"[^a-z0-9 ]", " ", str(value or "").lower())
    parts = [p for p in text.split() if p not in PREFIXES and p not in SUFFIXES]
    return " ".join(parts).strip()


def _norm_address(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", str(value or "").lower())).strip()


def _pincode_prefix(pin: str) -> str:
    return str(pin or "")[:3]


def _phonetic(name: str) -> str:
    base = _norm_text(name)
    if not base:
        return ""
    return f"{jellyfish.soundex(base)}-{jellyfish.metaphone(base)}"


def _parse_dates(serialized: str) -> list[pd.Timestamp]:
    out = []
    for part in str(serialized or "").split("|"):
        value = part.split(":", 1)[-1]
        try:
            out.append(pd.to_datetime(value))
        except Exception:
            continue
    return sorted(out)


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
    return events


def _jaccard_tokens(a: str, b: str) -> float:
    sa = set(a.split())
    sb = set(b.split())
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def behavioural_lag_boost(row_left: pd.Series, row_right: pd.Series) -> tuple[float, str]:
    """Detect repeated inspection date offsets across departments."""
    d1 = _parse_dates(row_left.get("inspection_dates", ""))
    d2 = _parse_dates(row_right.get("inspection_dates", ""))
    if len(d1) < 3 or len(d2) < 3:
        return 0.0, "no_lag_boost_insufficient_cycles"

    lags: list[int] = []
    for left_date in d1:
        nearest = min(d2, key=lambda right_date: abs((right_date - left_date).days))
        lag = (nearest - left_date).days
        if abs(lag) <= 14:
            lags.append(lag)

    if len(lags) < 3:
        return 0.0, "no_lag_boost_no_nearby_cycles"

    rounded_lags = [int(round(lag / 2) * 2) for lag in lags]
    dominant = max(set(rounded_lags), key=rounded_lags.count)
    support = rounded_lags.count(dominant)
    if support >= 3:
        boost = 0.30 if abs(dominant) <= 5 else 0.18
        return boost, f"behavioural_lag_boost_lag={dominant}_days_cycles={support}"
    return 0.0, "no_lag_boost_inconsistent_pattern"


def score_pair(left: pd.Series, right: pd.Series) -> tuple[float, dict[str, float], str]:
    pan_match = 1.0 if left.get("pan") and left.get("pan") == right.get("pan") else 0.0
    gstin_match = 1.0 if left.get("gstin") and left.get("gstin") == right.get("gstin") else 0.0
    name_score = JaroWinkler.normalized_similarity(left["name_norm"], right["name_norm"])
    addr_score = _jaccard_tokens(left["address_norm"], right["address_norm"])
    pin_match = 1.0 if left.get("pincode") and left.get("pincode") == right.get("pincode") else 0.0
    ph_match = 1.0 if left.get("name_phonetic") and left.get("name_phonetic") == right.get("name_phonetic") else 0.0

    weighted = (
        WEIGHTS["pan"] * pan_match
        + WEIGHTS["gstin"] * gstin_match
        + WEIGHTS["name"] * name_score
        + WEIGHTS["address"] * addr_score
        + WEIGHTS["pincode"] * pin_match
        + WEIGHTS["phonetic"] * ph_match
    )
    boost, boost_reason = behavioural_lag_boost(left, right)
    final_score = min(1.0, weighted + boost)
    components = {
        "pan_component": round(WEIGHTS["pan"] * pan_match, 4),
        "gstin_component": round(WEIGHTS["gstin"] * gstin_match, 4),
        "name_component": round(WEIGHTS["name"] * name_score, 4),
        "address_component": round(WEIGHTS["address"] * addr_score, 4),
        "pincode_component": round(WEIGHTS["pincode"] * pin_match, 4),
        "phonetic_component": round(WEIGHTS["phonetic"] * ph_match, 4),
        "behavioural_boost_component": round(boost, 4),
    }
    return final_score, components, boost_reason


def _decision_label(score: float) -> str:
    if score >= AUTO_LINK_THRESHOLD:
        return "AUTO_LINK"
    if score >= REVIEW_THRESHOLD:
        return "REVIEW"
    return "SEPARATE"


def _block_candidates(work: pd.DataFrame) -> set[tuple[str, str]]:
    blocks: dict[str, set[str]] = defaultdict(set)
    for _, row in work.iterrows():
        source_id = row["source_id"]
        if row.get("pan"):
            blocks[f"pan:{row['pan']}"].add(source_id)
        if row.get("gstin"):
            blocks[f"gstin:{row['gstin']}"].add(source_id)
        if row.get("name_norm") and row.get("pincode"):
            blocks[f"name_pin:{row['name_norm']}:{row['pincode']}"].add(source_id)
        if row.get("name_phonetic") and row.get("pincode"):
            blocks[f"phon_pin:{row['name_phonetic']}:{row['pincode']}"].add(source_id)

    pairs = set()
    for ids in blocks.values():
        if len(ids) < 2 or len(ids) > 80:
            continue
        for left_id, right_id in combinations(sorted(ids), 2):
            pairs.add((left_id, right_id))
    return pairs


def _distance_km(city_a: str, city_b: str) -> float:
    city_distance = {
        frozenset(("Bengaluru", "Mysuru")): 145,
        frozenset(("Bengaluru", "Hubballi")): 410,
        frozenset(("Bengaluru", "Mangaluru")): 350,
        frozenset(("Bengaluru", "Belagavi")): 510,
        frozenset(("Mysuru", "Hubballi")): 520,
        frozenset(("Mysuru", "Mangaluru")): 255,
        frozenset(("Mysuru", "Belagavi")): 610,
        frozenset(("Hubballi", "Mangaluru")): 360,
        frozenset(("Hubballi", "Belagavi")): 105,
        frozenset(("Mangaluru", "Belagavi")): 430,
    }
    if city_a == city_b:
        return 0.0
    return city_distance.get(frozenset((city_a, city_b)), math.inf)


def _veto_reasons_for_component(g: pd.DataFrame) -> list[str]:
    reasons: list[str] = []
    owners = {str(v).strip().lower() for v in g["owner_name"].dropna() if str(v).strip()}
    if len(owners) >= 3 or any("conflicting" in owner for owner in owners):
        reasons.append("temporal_veto_conflicting_owner_names")

    inspections_by_date: dict[str, set[str]] = defaultdict(set)
    for _, row in g.iterrows():
        for date in _parse_dates(row.get("inspection_dates", "")):
            inspections_by_date[date.date().isoformat()].add(str(row.get("city", "")))
    for date_text, cities in inspections_by_date.items():
        city_list = [city for city in cities if city]
        for city_a, city_b in combinations(city_list, 2):
            if _distance_km(city_a, city_b) >= 500:
                reasons.append(f"temporal_veto_same_day_far_cities_{date_text}")
                break
        if any(reason.startswith("temporal_veto_same_day_far_cities") for reason in reasons):
            break

    closure_dates = _parse_dates("|".join(g["closure_date"].fillna("").astype(str).tolist()))
    if closure_dates:
        earliest_closure = min(closure_dates)
        for _, row in g.iterrows():
            for event_type, event_date in _parse_events(row.get("event_history", "")):
                if event_type != "closure" and event_date > earliest_closure:
                    reasons.append("temporal_veto_activity_after_closure")
                    return sorted(set(reasons))
    return sorted(set(reasons))


def _apply_temporal_veto(component_rows: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for ubid, g in component_rows.groupby("ubid", sort=False):
        reasons = _veto_reasons_for_component(g)
        if reasons:
            for i, idx in enumerate(g.index, start=1):
                rows.append((idx, f"{ubid}-S{i:02d}", True, ";".join(reasons)))
        else:
            for idx in g.index:
                rows.append((idx, ubid, False, ""))
    return pd.DataFrame(rows, columns=["row_idx", "final_ubid", "veto_applied", "veto_reason"]).set_index("row_idx")


def run_linking_pipeline(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Run normalization, blocking, weighted scoring, graph propagation, and veto."""
    work = df.copy()
    work["name_norm"] = work["name"].map(_norm_text)
    work["address_norm"] = work["address"].map(_norm_address)
    work["pincode"] = work["pincode"].fillna("").astype(str)
    work["pincode_prefix"] = work["pincode"].map(_pincode_prefix)
    work["name_phonetic"] = work["name"].map(_phonetic)

    records = {r["source_id"]: r for _, r in work.iterrows()}
    candidate_pairs = _block_candidates(work)

    decision_rows = []
    graph = nx.Graph()
    graph.add_nodes_from(work["source_id"].tolist())

    for left_id, right_id in sorted(candidate_pairs):
        left = records[left_id]
        right = records[right_id]
        final_score, components, boost_reason = score_pair(left, right)
        decision = _decision_label(final_score)
        if decision == "AUTO_LINK":
            graph.add_edge(left_id, right_id, weight=final_score)

        decision_rows.append(
            {
                "left_id": left_id,
                "right_id": right_id,
                "left_name": left["name"],
                "right_name": right["name"],
                "left_department": left["source_department"],
                "right_department": right["source_department"],
                "left_city": left["city"],
                "right_city": right["city"],
                "confidence": round(final_score, 4),
                "decision": decision,
                "reason": f"weighted_fellegi_sunter|{boost_reason}",
                "match_summary": (
                    f"PAN={components['pan_component']} GSTIN={components['gstin_component']} "
                    f"NAME={components['name_component']} ADDR={components['address_component']} "
                    f"PIN={components['pincode_component']} PH={components['phonetic_component']} "
                    f"BOOST={components['behavioural_boost_component']}"
                ),
                **components,
            }
        )

    id_to_ubid = {}
    for i, comp in enumerate(nx.connected_components(graph), start=1):
        ubid = f"UBID-{i:06d}"
        for source_id in comp:
            id_to_ubid[source_id] = ubid

    work["ubid"] = work["source_id"].map(id_to_ubid)
    link_score_by_id = defaultdict(lambda: 0.5)
    for row in decision_rows:
        if row["decision"] == "AUTO_LINK":
            link_score_by_id[row["left_id"]] = max(link_score_by_id[row["left_id"]], row["confidence"])
            link_score_by_id[row["right_id"]] = max(link_score_by_id[row["right_id"]], row["confidence"])
    work["link_confidence"] = work["source_id"].map(link_score_by_id).astype(float)

    veto_df = _apply_temporal_veto(
        work[["ubid", "city", "owner_name", "inspection_dates", "event_history", "closure_date"]]
    )
    work = work.join(veto_df)
    work["ubid"] = work["final_ubid"]
    work = work.drop(columns=["final_ubid"])

    decisions = pd.DataFrame(decision_rows)
    return work, decisions
