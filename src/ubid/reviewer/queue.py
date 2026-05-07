from __future__ import annotations

import pandas as pd


def build_reviewer_queue(linked_df: pd.DataFrame, decisions_df: pd.DataFrame | None = None) -> pd.DataFrame:
    """Build a pair-level reviewer queue prioritized by uncertainty and risk."""
    decision_rows = pd.DataFrame() if decisions_df is None else decisions_df.copy()
    queue_parts = []

    if not decision_rows.empty:
        review = decision_rows[decision_rows["decision"].isin(["REVIEW", "AUTO_LINK"])].copy()
        if not review.empty:
            review["uncertainty_score"] = 1 - (review["confidence"] - 0.825).abs().clip(0, 1)
            review["behavioural_signal"] = review["behavioural_boost_component"].fillna(0).astype(float)
            review["identifier_signal"] = (
                review["pan_component"].fillna(0).astype(float)
                + review["gstin_component"].fillna(0).astype(float)
            )
            review["priority_score"] = (
                0.55 * review["uncertainty_score"]
                + 0.25 * review["behavioural_signal"]
                + 0.20 * (1 - review["identifier_signal"].clip(0, 1))
            ).round(4)
            review["queue_type"] = review["decision"].map(
                {"REVIEW": "Ambiguous match", "AUTO_LINK": "Audit sample"}
            )
            review["why_uncertain"] = review.apply(
                lambda r: (
                    "Strong behavioural pattern but weak identifiers"
                    if r["behavioural_signal"] > 0 and r["identifier_signal"] < 0.5
                    else "Confidence is near the human-review band"
                ),
                axis=1,
            )
            queue_parts.append(
                review[
                    [
                        "queue_type",
                        "left_id",
                        "right_id",
                        "left_name",
                        "right_name",
                        "left_department",
                        "right_department",
                        "confidence",
                        "priority_score",
                        "why_uncertain",
                        "reason",
                        "match_summary",
                    ]
                ]
            )

    if "veto_applied" in linked_df.columns:
        veto_rows = linked_df[linked_df["veto_applied"] == True].copy()
    else:
        veto_rows = pd.DataFrame()
    if not veto_rows.empty:
        veto_rows["queue_type"] = "Temporal veto"
        veto_rows["left_id"] = veto_rows["source_id"]
        veto_rows["right_id"] = ""
        veto_rows["left_name"] = veto_rows["name"]
        veto_rows["right_name"] = ""
        veto_rows["left_department"] = veto_rows["source_department"]
        veto_rows["right_department"] = ""
        veto_rows["confidence"] = veto_rows["link_confidence"]
        veto_rows["priority_score"] = 1.0
        veto_rows["why_uncertain"] = veto_rows["veto_reason"]
        veto_rows["reason"] = veto_rows["veto_reason"]
        veto_rows["match_summary"] = "Veto split this UBID and requires high-priority review."
        queue_parts.append(
            veto_rows[
                [
                    "queue_type",
                    "left_id",
                    "right_id",
                    "left_name",
                    "right_name",
                    "left_department",
                    "right_department",
                    "confidence",
                    "priority_score",
                    "why_uncertain",
                    "reason",
                    "match_summary",
                ]
            ]
        )

    if not queue_parts:
        return pd.DataFrame(
            columns=[
                "queue_type",
                "left_id",
                "right_id",
                "left_name",
                "right_name",
                "left_department",
                "right_department",
                "confidence",
                "priority_score",
                "why_uncertain",
                "reason",
                "match_summary",
            ]
        )

    return pd.concat(queue_parts, ignore_index=True).sort_values("priority_score", ascending=False).head(150)
