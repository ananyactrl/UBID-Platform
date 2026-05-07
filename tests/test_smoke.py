import pandas as pd

from ubid.classification.pipeline import run_activity_classification
from ubid.data.synthetic_generator import generate_synthetic_twins
from ubid.linking.pipeline import behavioural_lag_boost, run_linking_pipeline
from ubid.reviewer.queue import build_reviewer_queue


def test_end_to_end_smoke() -> None:
    src = generate_synthetic_twins(25, seed=1)
    linked, decisions = run_linking_pipeline(src)
    classified = run_activity_classification(linked)
    queue = build_reviewer_queue(linked, decisions)

    assert not src.empty
    assert "ubid" in linked.columns
    assert not classified.empty
    assert set(classified["classification"]).issubset({"ACTIVE", "DORMANT", "CLOSED"})
    assert "priority_score" in queue.columns


def test_behavioural_lag_boost_detects_repeated_offset() -> None:
    left = pd.Series({"inspection_dates": "2025-01-01|2025-04-01|2025-07-01"})
    right = pd.Series({"inspection_dates": "2025-01-03|2025-04-03|2025-07-03"})

    boost, reason = behavioural_lag_boost(left, right)

    assert boost == 0.30
    assert "cycles=3" in reason


def test_temporal_veto_splits_conflicting_component() -> None:
    src = generate_synthetic_twins(8, seed=10, conflict_rate=1.0, missing_pan_rate=0, missing_gstin_rate=0)
    linked, _ = run_linking_pipeline(src)

    assert linked["veto_applied"].any()
    assert linked["veto_reason"].fillna("").str.contains("temporal_veto").any()


def test_activity_classification_uses_events_and_cohort() -> None:
    df = pd.DataFrame(
        [
            {
                "ubid": "UBID-1",
                "source_department": "electricity",
                "pincode": "560001",
                "nic_code": "4711",
                "industry_sector": "Retail",
                "event_history": "electricity_bill:2026-05-01|renewal:2026-04-01",
            },
            {
                "ubid": "UBID-2",
                "source_department": "shops",
                "pincode": "560001",
                "nic_code": "4711",
                "industry_sector": "Retail",
                "event_history": "inspection:2023-01-01",
            },
        ]
    )

    classified = run_activity_classification(df)
    labels = dict(zip(classified["ubid"], classified["classification"]))

    assert labels["UBID-1"] == "ACTIVE"
    assert labels["UBID-2"] == "CLOSED"


def test_reviewer_queue_prioritizes_review_pairs() -> None:
    linked = pd.DataFrame(
        [
            {
                "source_id": "a",
                "ubid": "UBID-1",
                "link_confidence": 0.8,
                "name": "A",
                "source_department": "shops",
                "veto_applied": False,
                "veto_reason": "",
            }
        ]
    )
    decisions = pd.DataFrame(
        [
            {
                "decision": "REVIEW",
                "left_id": "a",
                "right_id": "b",
                "left_name": "Ganesh Bakery",
                "right_name": "Sri Ganesh Bakers",
                "left_department": "shops",
                "right_department": "pollution",
                "confidence": 0.82,
                "behavioural_boost_component": 0.30,
                "pan_component": 0.0,
                "gstin_component": 0.0,
                "reason": "weighted_fellegi_sunter|behavioural_lag_boost",
                "match_summary": "BOOST=0.3",
            }
        ]
    )

    queue = build_reviewer_queue(linked, decisions)

    assert queue.iloc[0]["queue_type"] == "Ambiguous match"
    assert queue.iloc[0]["priority_score"] > 0.7
