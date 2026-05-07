from __future__ import annotations

from pathlib import Path
import pandas as pd


OUTPUT_DIR = Path("artifacts")


def ensure_output_dir() -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    return OUTPUT_DIR


def write_artifact(df: pd.DataFrame, name: str) -> Path:
    out_dir = ensure_output_dir()
    path = out_dir / f"{name}.csv"
    df.to_csv(path, index=False)
    return path


def read_artifact(name: str) -> pd.DataFrame:
    path = OUTPUT_DIR / f"{name}.csv"
    if not path.exists():
        return pd.DataFrame()
    return pd.read_csv(path)


def append_artifact_row(name: str, row: dict) -> Path:
    out_dir = ensure_output_dir()
    path = out_dir / f"{name}.csv"
    df = pd.DataFrame([row])
    df.to_csv(path, mode="a", header=not path.exists(), index=False)
    return path
