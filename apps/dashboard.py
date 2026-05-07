from pathlib import Path
import subprocess
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

# ── Load artifacts ─────────────────────────────────────────────────────────────
linked_df   = read_artifact("linked_records")
decisions_df = read_artifact("link_decisions")
class_df    = read_artifact("activity_classification")
queue_df    = read_artifact("reviewer_queue")

if linked_df.empty:
    st.warning("No artifacts found. Run `python scripts/run_pipeline.py` first.")
    st.stop()

# ── KPI bar ────────────────────────────────────────────────────────────────────
auto_links  = int((decisions_df["decision"] == "AUTO_LINK").sum()) if not decisions_df.empty else 0
review_pairs = int((decisions_df["decision"] == "REVIEW").sum()) if not decisions_df.empty else 0
vetoes      = int(linked_df["veto_applied"].fillna(False).sum()) if "veto_applied" in linked_df.columns else 0
ubids       = linked_df["ubid"].nunique()
suspicious  = int(linked_df["suspicious"].fillna(False).sum()) if "suspicious" in linked_df.columns else 0

metric_cols = st.columns(6)
metric_cols[0].metric("Source Records",  f"{len(linked_df):,}")
metric_cols[1].metric("Resolved UBIDs",  f"{ubids:,}")
metric_cols[2].metric("Auto Links",      f"{auto_links:,}")
metric_cols[3].metric("Review Pairs",    f"{review_pairs:,}")
metric_cols[4].metric("Veto Flags",      f"{vetoes:,}")
metric_cols[5].metric("Suspicious",      f"{suspicious:,}", delta="fraud signals", delta_color="inverse")

# ── Tabs ───────────────────────────────────────────────────────────────────────
tab1, tab2, tab3, tab4, tab5, tab6, tab7 = st.tabs([
    "Resolution",
    "Map",
    "Reviewer Queue",
    "Confidence",
    "Lineage",
    "Activity",
    "Fraud Signals",
])

# ══════════════════════════════════════════════════════════════════════════════
# TAB 1 — Resolution table
# ══════════════════════════════════════════════════════════════════════════════
with tab1:
    st.subheader("Resolved Business Records")
    filters = st.columns(3)
    department  = filters[0].selectbox("Department", ["All"] + sorted(linked_df["source_department"].dropna().unique()))
    city        = filters[1].selectbox("City",       ["All"] + sorted(linked_df["city"].dropna().unique()))
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

    display_cols = ["ubid", "source_department", "source_id", "name",
                    "pincode", "nic_code", "city", "link_confidence",
                    "veto_applied", "veto_reason"]
    if "suspicious" in view.columns:
        display_cols.append("suspicious")
    st.dataframe(view[display_cols], use_container_width=True, hide_index=True)

# ══════════════════════════════════════════════════════════════════════════════
# TAB 2 — Map (businesses coloured by activity status)
# ══════════════════════════════════════════════════════════════════════════════
with tab2:
    st.subheader("Business Locations by Activity Status")

    if "lat" not in linked_df.columns or "lon" not in linked_df.columns:
        st.warning("lat/lon columns missing — re-run `python scripts/run_pipeline.py`.")
    else:
        # Join activity status onto linked records (one row per source record)
        map_df = linked_df[["ubid", "source_id", "name", "city",
                             "source_department", "lat", "lon"]].copy()
        if not class_df.empty:
            map_df = map_df.merge(
                class_df[["ubid", "classification"]],
                on="ubid", how="left"
            )
        else:
            map_df["classification"] = "UNKNOWN"

        map_df["classification"] = map_df["classification"].fillna("UNKNOWN")

        # Colour mapping: st.map supports color as [R,G,B,A] lists
        STATUS_RGBA = {
            "ACTIVE":  [46,  204, 113, 200],   # green
            "DORMANT": [241, 196,  15, 200],   # yellow
            "CLOSED":  [231,  76,  60, 200],   # red
            "UNKNOWN": [149, 165, 166, 180],   # grey
        }
        map_df["color"] = map_df["classification"].map(STATUS_RGBA)

        # Filter controls
        col_f1, col_f2 = st.columns(2)
        map_status = col_f1.multiselect(
            "Show status",
            ["ACTIVE", "DORMANT", "CLOSED"],
            default=["ACTIVE", "DORMANT", "CLOSED"],
        )
        map_dept = col_f2.selectbox(
            "Department",
            ["All"] + sorted(map_df["source_department"].dropna().unique()),
        )

        map_view = map_df[map_df["classification"].isin(map_status)]
        if map_dept != "All":
            map_view = map_view[map_view["source_department"] == map_dept]

        # Legend
        leg_cols = st.columns(4)
        for i, (status, rgba) in enumerate(STATUS_RGBA.items()):
            if status == "UNKNOWN":
                continue
            hex_col = "#{:02x}{:02x}{:02x}".format(*rgba[:3])
            count = int((map_df["classification"] == status).sum())
            leg_cols[i].markdown(
                f'<span style="color:{hex_col};font-size:1.2rem;">&#9632;</span> '
                f'**{status}** ({count})',
                unsafe_allow_html=True,
            )

        st.map(
            map_view.rename(columns={"lat": "latitude", "lon": "longitude"}),
            latitude="latitude",
            longitude="longitude",
            color="color",
            size=60,
        )

        st.caption(
            f"Showing {len(map_view):,} of {len(map_df):,} records. "
            "Each dot = one source record. Colour = UBID activity status."
        )

# ══════════════════════════════════════════════════════════════════════════════
# TAB 3 — Reviewer Queue with interactive merge + feedback loop
# ══════════════════════════════════════════════════════════════════════════════
with tab3:
    st.subheader("Prioritized Human Review")
    st.dataframe(queue_df, use_container_width=True, hide_index=True)

    if not queue_df.empty:
        st.divider()
        st.subheader("Review Actions")
        ambiguous_pairs = queue_df[queue_df["queue_type"] == "Ambiguous match"]
        if not ambiguous_pairs.empty:
            pair_labels = (
                ambiguous_pairs["left_id"].astype(str)
                + " <-> "
                + ambiguous_pairs["right_id"].astype(str)
            )
            selected_pair = st.selectbox("Select pair to review", options=pair_labels)
            left_id_sel  = selected_pair.split(" <-> ")[0].strip()
            right_id_sel = selected_pair.split(" <-> ")[1].strip()

            col1, col2, col3 = st.columns(3)
            with col1:
                if st.button("Merge", key="merge_btn", type="primary"):
                    with st.spinner(f"Applying merge {left_id_sel} <-> {right_id_sel} and re-running pipeline..."):
                        result = subprocess.run(
                            [sys.executable, str(ROOT / "scripts" / "apply_merge.py"),
                             left_id_sel, right_id_sel],
                            capture_output=True, text=True, cwd=str(ROOT),
                        )
                    if result.returncode == 0:
                        st.success("Merge applied! Artifacts updated.")
                        st.code(result.stdout)
                        st.rerun()
                    else:
                        st.error("Merge failed.")
                        st.code(result.stderr)
            with col2:
                if st.button("Keep Separate", key="separate_btn"):
                    st.warning(f"Marked separate: {selected_pair}")
            with col3:
                if st.button("Skip", key="skip_btn"):
                    st.info(f"Skipped: {selected_pair}")

        # Show merge history
        overrides = read_artifact("merge_overrides")
        if not overrides.empty:
            st.divider()
            st.subheader("Merge History")
            st.dataframe(overrides, use_container_width=True, hide_index=True)

# ══════════════════════════════════════════════════════════════════════════════
# TAB 4 — Confidence calibration
# ══════════════════════════════════════════════════════════════════════════════
with tab4:
    st.subheader("Confidence Calibration")
    if decisions_df.empty:
        st.info("No pair decisions were generated.")
    else:
        chart_df = decisions_df[["confidence", "decision"]].copy()
        chart_df["bucket"] = pd.cut(
            chart_df["confidence"],
            bins=[0, 0.7, 0.95, 1.0],
            labels=["Separate", "Review", "Auto-link"],
            include_lowest=True,
        )

        counts = chart_df["bucket"].value_counts()
        ordered_labels = ["Separate", "Review", "Auto-link"]
        ordered_counts = counts.reindex(ordered_labels).fillna(0)

        bar_data = pd.DataFrame({
            "counts": ordered_counts,
            "color": ["#FF4B4B", "#FFA500", "#4CAF50"],
        })
        st.bar_chart(bar_data, y="counts", color="color")

        st.dataframe(
            decisions_df.sort_values("confidence", ascending=False),
            use_container_width=True,
            hide_index=True,
        )

# ══════════════════════════════════════════════════════════════════════════════
# TAB 5 — Lineage / audit trail
# ══════════════════════════════════════════════════════════════════════════════
with tab5:
    st.subheader("UBID Lineage / Audit Trail")
    selected_ubid = st.selectbox("Select UBID", sorted(linked_df["ubid"].unique()))
    lineage = linked_df[linked_df["ubid"] == selected_ubid].copy()
    st.dataframe(
        lineage[[
            "source_department", "source_id", "name", "address",
            "pan", "gstin", "owner_name", "inspection_dates", "event_history",
        ]],
        use_container_width=True,
        hide_index=True,
    )
    if not decisions_df.empty:
        source_ids = set(lineage["source_id"])
        pair_audit = decisions_df[
            decisions_df["left_id"].isin(source_ids) | decisions_df["right_id"].isin(source_ids)
        ]
        st.dataframe(pair_audit, use_container_width=True, hide_index=True)

# ══════════════════════════════════════════════════════════════════════════════
# TAB 6 — Activity classification + cohort benchmarking
# ══════════════════════════════════════════════════════════════════════════════
with tab6:
    st.subheader("Activity Classification Evidence")

    if class_df.empty:
        st.info("No classification data found.")
    else:
        # Summary bar
        status_counts = class_df["classification"].value_counts()
        st.bar_chart(status_counts)

        st.divider()
        st.subheader("Cohort Benchmarking")
        st.caption(
            "Select a UBID to compare its annual event count against "
            "all businesses in the same pincode + industry cohort."
        )

        bench_ubid = st.selectbox(
            "Select UBID for cohort comparison",
            sorted(class_df["ubid"].unique()),
            key="bench_ubid",
        )
        bench_row = class_df[class_df["ubid"] == bench_ubid].iloc[0]
        cohort_key = str(bench_row["pincode"]) + "|" + str(bench_row["nic_code"])

        # All UBIDs in the same cohort
        cohort_df = class_df[
            (class_df["pincode"].astype(str) + "|" + class_df["nic_code"].astype(str)) == cohort_key
        ].copy()

        b_col1, b_col2, b_col3, b_col4 = st.columns(4)
        b_col1.metric("This UBID events/year", int(bench_row["events_this_year"]))
        b_col2.metric("Cohort median",         int(bench_row["cohort_median"]))
        b_col3.metric("Cohort size",           len(cohort_df))
        b_col4.metric("Status",                bench_row["classification"])

        # Sparkline: events_this_year for every UBID in cohort, highlight selected
        spark = cohort_df[["ubid", "events_this_year", "classification"]].copy()
        spark = spark.sort_values("events_this_year", ascending=False).reset_index(drop=True)
        spark["highlight"] = spark["ubid"] == bench_ubid
        spark["color"] = spark["highlight"].map({True: "#3498db", False: "#95a5a6"})

        st.bar_chart(
            spark.set_index("ubid")["events_this_year"],
            color="#95a5a6",
            height=180,
        )
        st.caption(
            f"Cohort: pincode={bench_row['pincode']}, NIC={bench_row['nic_code']} "
            f"({bench_row['industry_sector']})  |  "
            f"Selected UBID events: {int(bench_row['events_this_year'])}  |  "
            f"Median: {int(bench_row['cohort_median'])}"
        )

        st.divider()
        st.subheader("Live Streaming Simulation")
        st.caption(
            "Inject a new inspection event into a DORMANT UBID and watch it flip to ACTIVE."
        )

        dormant_ubids = class_df[class_df["classification"] == "DORMANT"]["ubid"].tolist()
        if dormant_ubids:
            stream_target = st.selectbox(
                "Target DORMANT UBID",
                dormant_ubids,
                key="stream_target",
            )
            if st.button("Inject inspection event", key="stream_btn", type="primary"):
                with st.spinner(f"Injecting event into {stream_target}..."):
                    result = subprocess.run(
                        [sys.executable, str(ROOT / "scripts" / "stream_event.py"), stream_target],
                        capture_output=True, text=True, cwd=str(ROOT),
                    )
                if result.returncode == 0:
                    st.success("Event injected! Artifacts updated.")
                    st.code(result.stdout)
                    st.rerun()
                else:
                    st.error("Stream injection failed.")
                    st.code(result.stderr)
        else:
            st.info("No DORMANT UBIDs available. All businesses are ACTIVE or CLOSED.")

        st.divider()
        st.dataframe(class_df, use_container_width=True, hide_index=True)

# ══════════════════════════════════════════════════════════════════════════════
# TAB 7 — Fraud Signals
# ══════════════════════════════════════════════════════════════════════════════
with tab7:
    st.subheader("Fraud & Anomaly Signals")
    st.caption(
        "Records flagged by the temporal veto engine or marked suspicious "
        "due to conflicting identifiers across departments."
    )

    # Combine veto flags + suspicious flags
    fraud_df = linked_df.copy()

    # Suspicious = generator-flagged (conflicting owner name across depts)
    if "suspicious" in fraud_df.columns:
        suspicious_df = fraud_df[fraud_df["suspicious"] == True].copy()
        suspicious_df["fraud_signal"] = "Conflicting owner name across departments"
    else:
        suspicious_df = pd.DataFrame()

    # Veto-flagged records
    veto_fraud = fraud_df[fraud_df["veto_applied"] == True].copy()
    veto_fraud["fraud_signal"] = veto_fraud["veto_reason"].str.replace("temporal_veto_", "").str.replace("_", " ").str.capitalize()

    # Combine
    all_fraud = pd.concat([suspicious_df, veto_fraud], ignore_index=True).drop_duplicates(subset=["source_id"])

    if all_fraud.empty:
        st.info("No fraud signals detected. Increase conflict_rate in run_pipeline.py for more signals.")
    else:
        # Summary metrics
        f_col1, f_col2, f_col3 = st.columns(3)
        f_col1.metric("Total flagged records", len(all_fraud))
        f_col2.metric("Unique UBIDs affected",  all_fraud["ubid"].nunique())
        f_col3.metric("Departments involved",   all_fraud["source_department"].nunique())

        # Signal breakdown
        st.subheader("Signal Breakdown")
        signal_counts = all_fraud["fraud_signal"].value_counts()
        st.bar_chart(signal_counts)

        # Detail table
        st.subheader("Flagged Records")
        fraud_cols = ["ubid", "source_id", "name", "source_department",
                      "city", "owner_name", "pan", "gstin", "fraud_signal"]
        fraud_cols = [c for c in fraud_cols if c in all_fraud.columns]
        st.dataframe(all_fraud[fraud_cols], use_container_width=True, hide_index=True)

        # Map of fraud locations (if lat/lon available)
        if "lat" in all_fraud.columns and "lon" in all_fraud.columns:
            st.subheader("Fraud Signal Locations")
            fraud_map = all_fraud[["lat", "lon", "fraud_signal", "name"]].dropna(subset=["lat", "lon"])
            if not fraud_map.empty:
                fraud_map["color"] = [[231, 76, 60, 220]] * len(fraud_map)
                st.map(
                    fraud_map.rename(columns={"lat": "latitude", "lon": "longitude"}),
                    latitude="latitude",
                    longitude="longitude",
                    color="color",
                    size=120,
                )
                st.caption("Red dots = flagged records. Larger size = higher risk.")
