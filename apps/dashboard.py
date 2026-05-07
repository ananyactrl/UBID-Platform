from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

import pandas as pd
import streamlit as st

from ubid.storage.repository import read_artifact


st.set_page_config(page_title="UBID Reviewer Dashboard", layout="wide")
st.title("UBID Platform - Reviewer Dashboard")
st.caption("Run `python scripts/run_pipeline.py` to regenerate synthetic demo artifacts.")

linked_df = read_artifact("linked_records")
decisions_df = read_artifact("link_decisions")
class_df = read_artifact("activity_classification")
queue_df = read_artifact("reviewer_queue")

if linked_df.empty:
    st.warning("No artifacts found. Run `python scripts/run_pipeline.py` first.")
    st.stop()

auto_links = int((decisions_df["decision"] == "AUTO_LINK").sum()) if not decisions_df.empty else 0
review_pairs = int((decisions_df["decision"] == "REVIEW").sum()) if not decisions_df.empty else 0
vetoes = int(linked_df["veto_applied"].fillna(False).sum()) if "veto_applied" in linked_df else 0
ubids = linked_df["ubid"].nunique()

metric_cols = st.columns(5)
metric_cols[0].metric("Source Records", f"{len(linked_df):,}")
metric_cols[1].metric("Resolved UBIDs", f"{ubids:,}")
metric_cols[2].metric("Auto Links", f"{auto_links:,}")
metric_cols[3].metric("Review Pairs", f"{review_pairs:,}")
metric_cols[4].metric("Veto Flags", f"{vetoes:,}")

tab1, tab2, tab3, tab4, tab5 = st.tabs(
    [
        "Resolution",
        "Reviewer Queue",
        "Confidence",
        "Lineage",
        "Activity",
    ]
)

with tab1:
    st.subheader("Resolved Business Records")
    filters = st.columns(3)
    department = filters[0].selectbox("Department", ["All"] + sorted(linked_df["source_department"].dropna().unique()))
    city = filters[1].selectbox("City", ["All"] + sorted(linked_df["city"].dropna().unique()))
    veto_filter = filters[2].selectbox("Veto status", ["All", "Vetoed", "Clean"])

    view = linked_df.copy()
    if department != "All":
        view = view[view["source_department"] == department]
    if city != "All":
        view = view[view["city"] == city]
    if veto_filter == "Vetoed":
        view = view[view["veto_applied"] == True]
    elif veto_filter == "Clean":
        view = view[view["veto_applied"] != True]

    st.dataframe(
        view[
            [
                "ubid",
                "source_department",
                "source_id",
                "name",
                "pincode",
                "nic_code",
                "city",
                "link_confidence",
                "veto_applied",
                "veto_reason",
            ]
        ],
        use_container_width=True,
        hide_index=True,
    )

with tab2:
    st.subheader("Prioritized Human Review")
    st.dataframe(queue_df, use_container_width=True, hide_index=True)

with tab3:
    st.subheader("Confidence Calibration")
    if decisions_df.empty:
        st.info("No pair decisions were generated.")
    else:
        chart_df = decisions_df[["confidence", "decision"]].copy()
        chart_df["bucket"] = pd.cut(chart_df["confidence"], bins=[0, 0.7, 0.95, 1.0], labels=["Separate", "Review", "Auto-link"])
        st.bar_chart(chart_df["bucket"].value_counts().sort_index())
        st.dataframe(
            decisions_df.sort_values("confidence", ascending=False),
            use_container_width=True,
            hide_index=True,
        )

with tab4:
    st.subheader("UBID Lineage / Audit Trail")
    selected_ubid = st.selectbox("Select UBID", sorted(linked_df["ubid"].unique()))
    lineage = linked_df[linked_df["ubid"] == selected_ubid].copy()
    st.dataframe(
        lineage[
            [
                "source_department",
                "source_id",
                "name",
                "address",
                "pan",
                "gstin",
                "owner_name",
                "inspection_dates",
                "event_history",
            ]
        ],
        use_container_width=True,
        hide_index=True,
    )
    if not decisions_df.empty:
        source_ids = set(lineage["source_id"])
        pair_audit = decisions_df[
            decisions_df["left_id"].isin(source_ids) | decisions_df["right_id"].isin(source_ids)
        ]
        st.dataframe(pair_audit, use_container_width=True, hide_index=True)

with tab5:
    st.subheader("Activity Classification Evidence")
    status_counts = class_df["classification"].value_counts() if not class_df.empty else pd.Series(dtype=int)
    if not status_counts.empty:
        st.bar_chart(status_counts)
    st.dataframe(class_df, use_container_width=True, hide_index=True)
