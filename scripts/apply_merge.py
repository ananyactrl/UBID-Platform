"""
Reviewer feedback loop: apply a human merge decision and re-run linking.

Usage:
    python scripts/apply_merge.py LEFT_ID RIGHT_ID

Example:
    python scripts/apply_merge.py sho_5 fac_5

The script:
  1. Writes the merge override to artifacts/merge_overrides.csv
  2. Re-runs the full linking pipeline with the override applied
     (the two source IDs are forced into the same UBID with confidence 1.0)
  3. Re-runs classification and reviewer queue
  4. Overwrites all artifacts
  5. Prints the resulting UBID and its department span
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

import pandas as pd

from ubid.classification.pipeline import run_activity_classification
from ubid.linking.pipeline import run_linking_pipeline
from ubid.reviewer.queue import build_reviewer_queue
from ubid.storage.repository import append_artifact_row, read_artifact, write_artifact


def apply_merge(left_id: str, right_id: str) -> None:
    source = read_artifact("synthetic_source")
    if source.empty:
        print("ERROR: Run python scripts/run_pipeline.py first.")
        sys.exit(1)

    # Record the override
    append_artifact_row(
        "merge_overrides",
        {"left_id": left_id, "right_id": right_id, "reviewer_action": "MERGE"},
    )
    print(f"\nMerge override recorded: {left_id} <-> {right_id}")

    # Load all existing overrides and inject them as forced PAN matches
    overrides = read_artifact("merge_overrides")
    forced_pairs: list[tuple[str, str]] = list(
        zip(overrides["left_id"].tolist(), overrides["right_id"].tolist())
    )

    # Re-run linking with overrides: patch source so forced pairs share a PAN
    patched = source.copy()
    for l_id, r_id in forced_pairs:
        left_rows = patched[patched["source_id"] == l_id]
        right_rows = patched[patched["source_id"] == r_id]
        if left_rows.empty or right_rows.empty:
            print(f"  WARNING: source_id {l_id} or {r_id} not found — skipping override")
            continue
        # Give both rows the same PAN so the linker will auto-link them
        shared_pan = left_rows.iloc[0]["pan"] if pd.notna(left_rows.iloc[0]["pan"]) else right_rows.iloc[0]["pan"]
        if pd.isna(shared_pan):
            shared_pan = f"MERGE{l_id[:4].upper()}{r_id[:4].upper()}"
        patched.loc[patched["source_id"] == l_id, "pan"] = shared_pan
        patched.loc[patched["source_id"] == r_id, "pan"] = shared_pan

    linked, decisions = run_linking_pipeline(patched)
    class_df = run_activity_classification(linked)
    queue_df = build_reviewer_queue(linked, decisions)

    write_artifact(linked, "linked_records")
    write_artifact(decisions, "link_decisions")
    write_artifact(class_df, "activity_classification")
    write_artifact(queue_df, "reviewer_queue")

    # Report result
    left_ubid = linked[linked["source_id"] == left_id]["ubid"].values
    right_ubid = linked[linked["source_id"] == right_id]["ubid"].values

    print(f"\n{'='*60}")
    print(f"  MERGE RESULT")
    print(f"{'='*60}")
    if len(left_ubid) and len(right_ubid) and left_ubid[0] == right_ubid[0]:
        ubid = left_ubid[0]
        group = linked[linked["ubid"] == ubid]
        depts = sorted(group["source_department"].unique().tolist())
        conf = group["link_confidence"].max()
        print(f"  UBID        : {ubid}")
        print(f"  Departments : {depts}")
        print(f"  Records     : {len(group)}")
        print(f"  Confidence  : {conf:.4f}")
        cls_row = class_df[class_df["ubid"] == ubid]
        if not cls_row.empty:
            print(f"  Status      : {cls_row.iloc[0]['classification']}")
        print(f"\n  SUCCESS: {left_id} and {right_id} now share {ubid}")
    else:
        print(f"  {left_id} -> {left_ubid}")
        print(f"  {right_id} -> {right_ubid}")
        print("  NOTE: IDs ended up in different UBIDs (may already be in same component)")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scripts/apply_merge.py LEFT_SOURCE_ID RIGHT_SOURCE_ID")
        print("Example: python scripts/apply_merge.py sho_5 fac_5")
        sys.exit(1)
    apply_merge(sys.argv[1], sys.argv[2])
