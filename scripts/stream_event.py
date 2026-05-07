"""
Live-streaming simulation: inject a new inspection event for a DORMANT UBID
and re-run classification only (no full re-link needed).

Usage:
    python scripts/stream_event.py                  # auto-picks first DORMANT UBID
    python scripts/stream_event.py UBID-000042      # target a specific UBID

The script:
  1. Finds a DORMANT UBID in activity_classification.csv
  2. Appends a fresh inspection event to every linked_records row for that UBID
  3. Re-runs run_activity_classification() on the updated linked_records
  4. Overwrites activity_classification.csv
  5. Prints a before/after status comparison so you can see the flip live
"""
from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

import pandas as pd

from ubid.classification.pipeline import run_activity_classification
from ubid.storage.repository import read_artifact, write_artifact

TODAY = datetime(2026, 5, 5)
NEW_EVENT_DATE = TODAY.date().isoformat()


def inject_event(target_ubid: str | None = None) -> None:
    linked = read_artifact("linked_records")
    activity = read_artifact("activity_classification")

    if linked.empty or activity.empty:
        print("ERROR: Run python scripts/run_pipeline.py first.")
        sys.exit(1)

    # Pick a DORMANT UBID if none specified
    if target_ubid is None:
        dormant = activity[activity["classification"] == "DORMANT"]
        if dormant.empty:
            print("No DORMANT UBIDs found. Try a CLOSED one:")
            print(activity[activity["classification"] == "CLOSED"]["ubid"].head(3).tolist())
            sys.exit(0)
        target_ubid = dormant.iloc[0]["ubid"]

    before_row = activity[activity["ubid"] == target_ubid]
    if before_row.empty:
        print(f"UBID {target_ubid} not found in activity_classification.csv")
        sys.exit(1)

    before_status = before_row.iloc[0]["classification"]
    before_events = before_row.iloc[0]["events_this_year"]
    before_recency = before_row.iloc[0]["recency_score"]

    print(f"\n{'='*60}")
    print(f"  LIVE STREAM SIMULATION")
    print(f"{'='*60}")
    print(f"  Target UBID : {target_ubid}")
    print(f"  BEFORE      : {before_status}  |  events_this_year={before_events}  |  recency={before_recency:.4f}")
    print(f"  Injecting   : inspection:{NEW_EVENT_DATE} into all {target_ubid} records")

    # Append the new event to every row belonging to this UBID
    mask = linked["ubid"] == target_ubid
    linked.loc[mask, "event_history"] = linked.loc[mask, "event_history"].apply(
        lambda h: h + f"|inspection:{NEW_EVENT_DATE}" if pd.notna(h) and h != "" else f"inspection:{NEW_EVENT_DATE}"
    )
    linked.loc[mask, "inspection_dates"] = linked.loc[mask, "inspection_dates"].apply(
        lambda d: d + f"|{NEW_EVENT_DATE}" if pd.notna(d) and d != "" else NEW_EVENT_DATE
    )

    # Re-run classification on the full updated linked_records
    new_activity = run_activity_classification(linked)

    after_row = new_activity[new_activity["ubid"] == target_ubid]
    after_status = after_row.iloc[0]["classification"]
    after_events = after_row.iloc[0]["events_this_year"]
    after_recency = after_row.iloc[0]["recency_score"]

    print(f"  AFTER       : {after_status}  |  events_this_year={after_events}  |  recency={after_recency:.4f}")

    if before_status != after_status:
        print(f"\n  *** STATUS FLIP: {before_status} -> {after_status} ***")
    else:
        print(f"\n  Status unchanged ({after_status}) — recency improved from {before_recency:.4f} to {after_recency:.4f}")

    # Persist updated artifacts
    write_artifact(linked, "linked_records")
    write_artifact(new_activity, "activity_classification")
    print(f"\n  Artifacts updated. Refresh the dashboard to see the change.")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else None
    inject_event(target)
