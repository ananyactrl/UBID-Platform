# UBID Platform Demo Script

## 60-Second Pitch

Karnataka departments each hold partial business records, but the same real-world business appears differently in every system. UBID is a standalone read-only linking layer. It resolves duplicate records, assigns one Unique Business Identifier, classifies business activity, and gives reviewers clear evidence without changing department systems.

## Demo Flow

1. Generate demo data:

   ```bash
   python scripts/run_pipeline.py
   ```

2. Open the reviewer dashboard:

   ```bash
   streamlit run apps/dashboard.py
   ```

3. Start with the KPI row:

   - Source Records
   - Resolved UBIDs
   - Auto Links
   - Review Pairs
   - Veto Flags

4. Show the Confidence tab:

   Explain that each pair is scored using PAN, GSTIN, name similarity, address similarity, pincode, phonetic name, and behavioural inspection lag.

5. Show the Reviewer Queue:

   Point to `why_uncertain`, `reason`, and `match_summary`. This is where human reviewers see the exact evidence behind ambiguous matches.

6. Show the Lineage tab:

   Select one UBID and show how records from shops, factories, pollution, and electricity are grouped under the same business identity.

7. Show the Activity tab:

   Explain that recent electricity bills, renewals, filings, and inspections are scored with half-life decay, then compared to similar businesses in the same pincode and industry.

8. Open the Business Portal:

   ```bash
   streamlit run apps/portal.py --server.port 8602
   ```

   Lookup by PAN or GSTIN, then submit a wrong-merge or closure report. The feedback is stored in `artifacts/portal_feedback.csv`.

## Judge Talking Points

- The platform is read-only and does not require department system changes.
- Behavioural fingerprint matching helps when names and addresses are messy.
- Cohort-based classification avoids false dormant labels.
- Temporal vetoes prevent dangerous over-merging.
- Synthetic Twin Generator allows threshold calibration without real PII.
- The business portal creates a feedback loop from the people who know their records best.
