
# UBID Platform

AI-powered cross-department business identity resolution and activity classification for Karnataka.

The platform reads department datasets without modifying source systems, links duplicate business records into one **Unique Business Identifier (UBID)**, classifies each real-world business as `ACTIVE`, `DORMANT`, or `CLOSED`, and provides three interfaces for reviewers, businesses, and analysts.

---

## The Problem

Karnataka has 40+ government departments — Shops & Establishments, Factories, Pollution Control, Electricity Board, Fire Safety, GST Portal — each maintaining its own business database. The same bakery appears as:

| Department | Name on Record |
|---|---|
| Shops & Establishments | `M/s Ganesh Bakery` |
| Factories | `Ganesh Bakery Pvt Ltd` |
| Pollution Control | `Sri Ganesh Bakers` |
| Electricity Board | `M/s Ganesh Bakery Traders` |

Without a shared identifier, no one can answer: Are these the same business? Is it still operating? Which department record is stale?

**UBID answers all of this automatically.**

---

## What Makes This Different

### Behavioural Fingerprint Matching
Beyond PAN, GSTIN, name, and address — the system compares **inspection date patterns**. If Shops and Factories inspections consistently happen 1–2 days apart across 5 cycles, that is a strong signal they are the same business. This boost fires even when identifiers are missing or names are messy.

### Cohort-Based Activity Classification
A business is not called dormant just because it has few events. It is compared against similar businesses in the same `pincode + industry` cohort. A factory with 2 inspections per year may be perfectly normal; a restaurant with 2 events per year may be dormant.

### Temporal Consistency Veto
After graph propagation creates UBIDs, safety checks split suspicious components:
- Same-day inspections in cities 500+ km apart
- Activity recorded after a closure event
- Three or more conflicting owner names in one component

### Synthetic Twin Generator
Generates realistic cross-department records with configurable typos, missing identifiers, address variants, inspection lag patterns, duplicates, closures, and veto conflicts — no real PII required for demo or calibration.

---

## Architecture

```
scripts/run_pipeline.py
        │
        ▼
Synthetic Generator  →  ~350 source records (80 businesses × 4 departments)
        │
        ▼
Linking Pipeline
  Normalize → Block → Score (Fellegi-Sunter + Behavioural Boost)
  → Graph Propagation → Temporal Veto
        │
        ├── artifacts/linked_records.csv
        └── artifacts/link_decisions.csv
        │
        ▼
Activity Classifier  (half-life decay + cohort comparison)
        │
        └── artifacts/activity_classification.csv
        │
        ▼
Reviewer Queue Builder  (priority scoring)
        │
        └── artifacts/reviewer_queue.csv
        │
        ▼
Three interfaces read from artifacts/:
  ├── apps/dashboard.py   →  Streamlit reviewer dashboard  (port 8601)
  ├── apps/portal.py      →  Streamlit business portal     (port 8602)
  └── apps/api.py         →  FastAPI JSON backend          (port 8000)
                                      │
                                      ▼
                            ubid-dashboard/  →  React dashboard  (port 5173)
```

---

## Repository Layout

```
apps/
  api.py                FastAPI backend — serves artifacts as JSON for React
  dashboard.py          Streamlit reviewer dashboard (original)
  portal.py             Streamlit business self-service portal (original)

scripts/
  run_pipeline.py       Generates data, links records, classifies activity, writes artifacts

src/ubid/
  data/                 Synthetic Twin Generator
  linking/              Normalization, blocking, scoring, graph propagation, veto
  classification/       Half-life recency and cohort activity classification
  reviewer/             Prioritized reviewer queue builder
  storage/              CSV artifact read/write
  models/               Data classes (BusinessRecord, LinkDecision)
  config.py             Runtime settings (thresholds, DB URL)

ubid-dashboard/         React + Vite interactive dashboard
  src/
    App.jsx             All views — fetches from FastAPI backend
    data.js             API base URL
    index.css           Dark mode styling

tests/
  test_smoke.py         Smoke and core behaviour tests

artifacts/              Generated pipeline outputs (auto-created)
  synthetic_source.csv
  linked_records.csv
  link_decisions.csv
  activity_classification.csv
  reviewer_queue.csv

PROJECT_EXPLANATION.md  Deep technical explanation of every component
DEMO_SCRIPT.md          Step-by-step demo walkthrough
```

---

## Quick Start

Requires **Python 3.10+** and **Node.js 18+**.

### 1. Install Python dependencies

```bash
python -m venv .venv
```

**Windows (PowerShell):**
```powershell
.\.venv\Scripts\Activate.ps1
pip install -e .
```

**Linux / macOS:**
```bash
source .venv/bin/activate
pip install -e .
```

### 2. Run the pipeline

```bash
python scripts/run_pipeline.py
```

Writes five CSV files to `artifacts/`. Takes a few seconds.

### 3. Start the FastAPI backend

```bash
python -m uvicorn apps.api:app --reload --port 8000
```

Runs at `http://127.0.0.1:8000`. Required for the React dashboard.

### 4. Start the React dashboard

```bash
cd ubid-dashboard
npm install
npm run dev
```

Open **http://localhost:5173**

### 5. (Optional) Run the original Streamlit apps

```bash
# Reviewer dashboard
streamlit run apps/dashboard.py

# Business portal (separate terminal)
streamlit run apps/portal.py --server.port 8602
```

| App | URL |
|---|---|
| React Dashboard | http://localhost:5173 |
| FastAPI Backend | http://127.0.0.1:8000 |
| Streamlit Dashboard | http://localhost:8501 |
| Business Portal | http://localhost:8602 |

---

## Docker

Runs the Streamlit apps only (React dashboard requires Node.js separately).

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Reviewer Dashboard | http://localhost:8601 |
| Business Portal | http://localhost:8602 |

---

## The Interfaces

### React Dashboard (http://localhost:5173)

The primary visual interface. Fetches real pipeline data from the FastAPI backend.

| Tab | What it shows |
|---|---|
| **Command Center** | 5 KPI cards + inspection activity area chart + ACTIVE/DORMANT/CLOSED distribution |
| **Resolution** | Filterable, paginated table of all linked records with confidence colour coding |
| **Reviewer Queue** | Real ambiguous pairs, navigable with Merge / Keep Separate / Skip actions and a progress bar |
| **Confidence** | Bar chart of AUTO_LINK / REVIEW / SEPARATE distribution + top pair decisions table |
| **Lineage** | Select any UBID → see all source records grouped under it + classification evidence |
| **Activity** | Click-to-filter status summary + full classification evidence table |
| **Business Portal** | PAN/GSTIN lookup against real data + feedback form that saves to `portal_feedback.csv` |

### Streamlit Reviewer Dashboard (apps/dashboard.py)

The original working dashboard. Reads directly from `artifacts/*.csv`.

Tabs: Resolution · Reviewer Queue · Confidence · Lineage · Activity

### Streamlit Business Portal (apps/portal.py)

Self-service lookup for business owners. Enter PAN or GSTIN, see the unified profile, submit feedback (wrong merge, closure report, status correction).

### FastAPI Backend (apps/api.py)

REST API that serves the CSV artifacts as JSON. Full endpoint reference in `PROJECT_EXPLANATION.md`.

---

## Pipeline Configuration

Edit `scripts/run_pipeline.py` to change the synthetic data parameters:

```python
generate_synthetic_twins(
    n_businesses=80,          # Number of unique businesses
    typo_rate=0.18,           # Probability of a character swap in names
    missing_pan_rate=0.12,    # Probability of PAN being absent
    missing_gstin_rate=0.18,  # Probability of GSTIN being absent
    address_variation_rate=0.35,
    duplicate_rate=0.08,      # Probability of a duplicate record per department
    closure_rate=0.10,        # Probability of a business being closed
    lag_strength=0.85,        # Consistency of the inspection lag pattern
)
```

Edit `src/ubid/config.py` to change matching thresholds:

```python
auto_link_threshold: float = 0.95   # Pairs above this are auto-linked
review_threshold: float = 0.70      # Pairs between this and auto_link go to review
```

---

## Scoring Weights

The linking pipeline uses a weighted Fellegi-Sunter style score:

| Feature | Weight | Method |
|---|---|---|
| PAN match | 35% | Exact match |
| GSTIN match | 30% | Exact match |
| Name similarity | 15% | Jaro-Winkler on normalized name |
| Address similarity | 10% | Jaccard token overlap |
| Pincode match | 5% | Exact match |
| Phonetic name match | 5% | Soundex + Metaphone |
| **Behavioural boost** | **+0.30** | Consistent inspection lag ≤ 5 days across ≥ 3 cycles |
| **Behavioural boost** | **+0.18** | Consistent inspection lag 6–14 days across ≥ 3 cycles |

---

## Activity Classification Rules

Applied in order per UBID:

1. Closure event exists with no later activity → **CLOSED**
2. Recency score > 0.5 → **ACTIVE**
3. Events this year > cohort median (same pincode + NIC code) → **ACTIVE**
4. No events this year and last event > 730 days ago → **CLOSED**
5. Otherwise → **DORMANT**

Recency score uses half-life decay: `score = e^(-days / half_life)` where half-lives are 90 days for utility bills, 180 days for renewals/filings, and 365 days for inspections.

---

## Artifacts Reference

| File | Key columns |
|---|---|
| `synthetic_source.csv` | source_department, source_id, business_key, name, address, pan, gstin, inspection_dates, event_history, closure_date |
| `linked_records.csv` | + ubid, link_confidence, veto_applied, veto_reason |
| `link_decisions.csv` | left_id, right_id, confidence, decision, reason, match_summary, pan_component … behavioural_boost_component |
| `activity_classification.csv` | ubid, classification, classification_reason, recency_score, events_this_year, cohort_median, last_event_date |
| `reviewer_queue.csv` | queue_type, left_id, right_id, confidence, priority_score, why_uncertain, match_summary |
| `portal_feedback.csv` | submitted_at, feedback_type, ubid, contact, details, status |

---

## Tests

```bash
pytest -q
```

Covers: end-to-end pipeline smoke · behavioural lag boost detection · temporal veto split · cohort-based classification · reviewer queue prioritization.

---

## Data Privacy & Security

This is a prototype. For production:

- PAN and GSTIN should be encrypted at rest and masked in the reviewer UI
- Role-based access control should restrict department reviewers to their own records
- Every record access should be audit-logged with timestamp and user ID
- The OTP field in the portal should connect to a real OTP provider
- `portal_feedback.csv` should be replaced with a database table with access controls

---

## Scalability

The prototype uses pandas and CSV files for simplicity. The architecture is designed to scale:

| Component | Prototype | Production path |
|---|---|---|
| Storage | CSV files | PostgreSQL or Delta Lake |
| Processing | pandas (single machine) | Apache Spark or Dask |
| API | FastAPI + CSV reads | FastAPI + indexed DB queries |
| Updates | Full pipeline re-run | Incremental change data capture |

The core pipeline functions are stateless DataFrame transformations — migrating to Spark means replacing `pd.DataFrame` with `spark.DataFrame` without rewriting the algorithms.

---


- `PROJECT_EXPLANATION.md` — deep technical explanation of every component, algorithm, and design decision
- `DEMO_SCRIPT.md` — step-by-step demo walkthrough for judges and stakeholders
