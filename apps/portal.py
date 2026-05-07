from datetime import datetime
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

import streamlit as st

from ubid.storage.repository import append_artifact_row, read_artifact


st.set_page_config(page_title="UBID Business Portal", layout="centered")
st.title("UBID Business Self-Service Portal")
st.caption("Prototype lookup and feedback flow for business owners.")

linked_df = read_artifact("linked_records")

lookup_type = st.segmented_control("Lookup type", ["PAN", "GSTIN"], default="PAN")
lookup_value = st.text_input(f"Enter {lookup_type}")
otp = st.text_input("OTP", type="password", help="Prototype verification field")

matched_ubid = ""
if st.button("Search UBID", type="primary"):
    if not lookup_value or not otp:
        st.warning("Please provide lookup value and OTP.")
    elif linked_df.empty:
        st.error("No linked data found. Run the pipeline first.")
    else:
        key = "pan" if lookup_type == "PAN" else "gstin"
        matches = linked_df[linked_df[key].fillna("").astype(str).str.upper() == lookup_value.strip().upper()]
        if matches.empty:
            st.info("No UBID found for the provided details.")
        else:
            matched_ubid = str(matches["ubid"].iloc[0])
            st.session_state["matched_ubid"] = matched_ubid
            st.success(f"UBID match found: {matched_ubid}")
            st.dataframe(
                matches[
                    [
                        "ubid",
                        "name",
                        "source_department",
                        "pan",
                        "gstin",
                        "address",
                        "city",
                    ]
                ],
                use_container_width=True,
                hide_index=True,
            )

st.divider()
st.subheader("Business Feedback")

feedback_type = st.selectbox(
    "Request type",
    ["Claim UBID", "Report wrong merge", "Report closure", "Update business details"],
)
ubid_value = st.text_input("UBID", value=st.session_state.get("matched_ubid", ""))
business_name = st.text_input("Business name")
contact = st.text_input("Contact phone/email")
details = st.text_area("Details")

if st.button("Submit Feedback"):
    if not feedback_type or not contact or not details:
        st.warning("Please provide contact and request details.")
    else:
        append_artifact_row(
            "portal_feedback",
            {
                "submitted_at": datetime.utcnow().isoformat(timespec="seconds"),
                "feedback_type": feedback_type,
                "ubid": ubid_value,
                "business_name": business_name,
                "contact": contact,
                "details": details,
                "status": "NEW",
            },
        )
        st.success("Feedback submitted for reviewer follow-up.")

feedback_df = read_artifact("portal_feedback")
if not feedback_df.empty:
    with st.expander("Submitted feedback queue"):
        st.dataframe(feedback_df.tail(20), use_container_width=True, hide_index=True)
