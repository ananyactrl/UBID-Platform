from __future__ import annotations

import random
from datetime import datetime, timedelta

import pandas as pd


DEPARTMENTS = ["shops", "factories", "pollution", "electricity"]
CITIES = ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi"]
SECTORS = [
    ("1071", "Bakery"),
    ("4711", "Retail"),
    ("2599", "Fabrication"),
    ("5510", "Lodging"),
    ("5610", "Restaurant"),
]
BUSINESS_ROOTS = [
    "Ganesh",
    "Nandi",
    "Cauvery",
    "Kaveri",
    "Udupi",
    "Mysore",
    "Malnad",
    "Hoysala",
    "Vijaya",
    "Srinidhi",
    "Shree Durga",
    "Basaveshwara",
    "Bharath",
    "Karnataka",
    "Bangalore",
    "Sampoorna",
    "Aditya",
    "Lakshmi",
    "Navarasa",
    "Sri Sai",
    "Pragathi",
    "Sahyadri",
    "Mandya",
    "Chamundi",
    "Metro",
    "Royal",
    "Green",
    "Classic",
    "Premier",
    "Unity",
]


def _maybe_typo(text: str, rng: random.Random, typo_rate: float) -> str:
    if rng.random() >= typo_rate or len(text) < 5:
        return text
    idx = rng.randrange(1, len(text) - 1)
    return text[:idx] + text[idx + 1] + text[idx] + text[idx + 2 :]


def _variant_name(base_name: str, sector_name: str, rng: random.Random, typo_rate: float) -> str:
    prefixes = ["", "M/s ", "Sri ", "Shri "]
    suffixes = ["", " Pvt Ltd", " Traders", " Enterprises", " LLP", f" {sector_name}s"]
    name = f"{rng.choice(prefixes)}{base_name}{rng.choice(suffixes)}".strip()
    return _maybe_typo(name, rng, typo_rate)


def _variant_address(idx: int, city: str, rng: random.Random, variation_rate: float) -> str:
    base = f"No {idx}, Main Road, Industrial Area, {city}"
    if rng.random() >= variation_rate:
        return base
    variants = [
        f"{idx} Main Rd, Ind Area, {city}",
        f"Plot {idx}, Main Road, {city}",
        f"Door {idx}, Industrial Area, {city}",
    ]
    return rng.choice(variants)


def _inspection_dates(
    base_date: datetime,
    cycles: int,
    base_offset: int,
    dept: str,
    rng: random.Random,
    lag_strength: float,
) -> list[str]:
    lag_by_dept = {"factories": 0, "shops": 1, "pollution": 2, "electricity": 3}
    dates = []
    for cycle in range(cycles):
        lag = lag_by_dept.get(dept, 0)
        if rng.random() > lag_strength:
            lag += rng.choice([-7, -3, 5, 9])
        event_date = base_date + timedelta(days=base_offset + cycle * 90 + lag)
        dates.append(event_date.date().isoformat())
    return dates


def _events_for_record(
    inspection_dates: list[str],
    dept: str,
    rng: random.Random,
    closed: bool,
    closure_date: datetime | None,
) -> list[str]:
    events = [f"inspection:{d}" for d in inspection_dates]
    today = datetime(2026, 5, 5)

    if dept == "electricity" and not closed:
        for month in range(0, rng.randint(4, 12)):
            bill_date = today - timedelta(days=month * 30 + rng.randint(0, 5))
            events.append(f"electricity_bill:{bill_date.date().isoformat()}")

    if dept in {"shops", "factories"} and not closed:
        for year in [2024, 2025, 2026]:
            if rng.random() > 0.2:
                events.append(f"renewal:{year}-04-{rng.randint(1, 27):02d}")

    if dept == "pollution" and rng.random() > 0.25 and not closed:
        events.append(f"filing:{today.date().isoformat()}")

    if closed and closure_date:
        events = [event for event in events if event.split(":", 1)[1] <= closure_date.date().isoformat()]
        events.append(f"closure:{closure_date.date().isoformat()}")

    return sorted(events, key=lambda item: item.split(":", 1)[1])


def generate_synthetic_twins(
    n_businesses: int = 500,
    seed: int = 42,
    typo_rate: float = 0.15,
    missing_pan_rate: float = 0.10,
    missing_gstin_rate: float = 0.15,
    address_variation_rate: float = 0.30,
    duplicate_rate: float = 0.05,
    closure_rate: float = 0.08,
    lag_strength: float = 0.85,
    conflict_rate: float = 0.03,
) -> pd.DataFrame:
    """Generate realistic synthetic cross-department business records.

    The output intentionally includes typos, missing identifiers, address variants,
    correlated inspection lags, duplicate source records, closure events, and a
    small number of impossible conflicts for veto testing.
    """
    rng = random.Random(seed)
    rows = []
    base_date = datetime(2023, 1, 1)

    for idx in range(1, n_businesses + 1):
        nic_code, sector_name = SECTORS[idx % len(SECTORS)]
        root_name = rng.choice(BUSINESS_ROOTS)
        base_name = f"{root_name} {sector_name} {idx}"
        pan = f"ABCDE{idx:04d}F"
        gstin = f"29ABCDE{idx:04d}F1Z{idx % 9 + 1}"
        city = CITIES[idx % len(CITIES)]
        owner = f"Owner {idx}"
        pincode = f"{560000 + (idx % 80):06d}"
        closed = rng.random() < closure_rate
        closure_date = datetime(2025, rng.randint(1, 12), rng.randint(1, 25)) if closed else None
        cycles = rng.randint(3, 6)
        base_offset = rng.randint(0, 45)
        conflict = rng.random() < conflict_rate

        for dept in DEPARTMENTS:
            dept_city = city
            dept_owner = owner
            if conflict and dept == "pollution":
                dept_city = rng.choice([c for c in CITIES if c != city])
            if conflict and dept == "electricity":
                dept_owner = f"Conflicting Owner {idx}"

            inspection_dates = _inspection_dates(base_date, cycles, base_offset, dept, rng, lag_strength)
            if conflict and dept in {"factories", "pollution"}:
                inspection_dates[0] = "2025-06-15"

            record = {
                "source_department": dept,
                "source_id": f"{dept[:3]}_{idx}",
                "business_key": f"BIZ-{idx:05d}",
                "name": _variant_name(base_name, sector_name, rng, typo_rate),
                "address": _variant_address(idx, dept_city, rng, address_variation_rate),
                "pincode": pincode,
                "pan": pan if rng.random() > missing_pan_rate else None,
                "gstin": gstin if rng.random() > missing_gstin_rate else None,
                "owner_name": dept_owner,
                "nic_code": nic_code,
                "industry_sector": sector_name,
                "city": dept_city,
                "inspection_dates": "|".join(inspection_dates),
                "event_history": "|".join(_events_for_record(inspection_dates, dept, rng, closed, closure_date)),
                "closure_date": closure_date.date().isoformat() if closure_date else "",
            }
            rows.append(record)

            if rng.random() < duplicate_rate:
                dup = record.copy()
                dup["source_id"] = f"{dept[:3]}_{idx}_dup"
                dup["name"] = _maybe_typo(dup["name"], rng, min(1.0, typo_rate + 0.25))
                dup["address"] = _variant_address(idx, dept_city, rng, 1.0)
                rows.append(dup)

    return pd.DataFrame(rows)
