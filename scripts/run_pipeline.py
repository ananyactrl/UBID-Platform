from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from ubid.data.synthetic_generator import generate_synthetic_twins
from ubid.linking.pipeline import run_linking_pipeline
from ubid.classification.pipeline import run_activity_classification
from ubid.reviewer.queue import build_reviewer_queue
from ubid.storage.repository import write_artifact


def main() -> None:
    source_df = generate_synthetic_twins(
        n_businesses=80,
        typo_rate=0.18,
        missing_pan_rate=0.12,
        missing_gstin_rate=0.18,
        address_variation_rate=0.35,
        duplicate_rate=0.08,
        closure_rate=0.10,
        lag_strength=0.85,
        conflict_rate=0.08,
    )
    linked_df, link_decisions = run_linking_pipeline(source_df)
    class_df = run_activity_classification(linked_df)
    queue_df = build_reviewer_queue(linked_df, link_decisions)

    write_artifact(source_df, "synthetic_source")
    write_artifact(linked_df, "linked_records")
    write_artifact(link_decisions, "link_decisions")
    write_artifact(class_df, "activity_classification")
    write_artifact(queue_df, "reviewer_queue")
    print("Pipeline completed. Artifacts written to ./artifacts")


if __name__ == "__main__":
    main()
