"""
Start all UBID Platform services in parallel.

Usage:
    python scripts/start_all.py

Opens:
    http://localhost:8501  — Streamlit Reviewer Dashboard
    http://localhost:8602  — Streamlit Business Portal
    http://localhost:8000  — FastAPI backend (required by React)
    http://localhost:5173  — React Command Center (npm run dev)

Press Ctrl+C to stop all services.
"""
from __future__ import annotations

import subprocess
import sys
import time
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    print("\n=== UBID Platform — Starting all services ===\n")

    procs: list[subprocess.Popen] = []

    # 1. FastAPI backend
    api = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "apps.api:app", "--port", "8000", "--reload"],
        cwd=str(ROOT),
    )
    procs.append(api)
    print("  [1/4] FastAPI API        -> http://localhost:8000")

    time.sleep(1)

    # 2. Streamlit dashboard
    dash = subprocess.Popen(
        [sys.executable, "-m", "streamlit", "run", "apps/dashboard.py",
         "--server.port", "8501", "--server.headless", "true"],
        cwd=str(ROOT),
    )
    procs.append(dash)
    print("  [2/4] Streamlit Dashboard -> http://localhost:8501")

    # 3. Streamlit portal
    portal = subprocess.Popen(
        [sys.executable, "-m", "streamlit", "run", "apps/portal.py",
         "--server.port", "8602", "--server.headless", "true"],
        cwd=str(ROOT),
    )
    procs.append(portal)
    print("  [3/4] Streamlit Portal    -> http://localhost:8602")

    # 4. React dev server
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    react = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=str(ROOT / "ubid-dashboard"),
    )
    procs.append(react)
    print("  [4/4] React Dashboard     -> http://localhost:5173")

    print("\n  All services started. Press Ctrl+C to stop.\n")

    try:
        while True:
            time.sleep(1)
            # Restart any process that died unexpectedly
            for i, p in enumerate(procs):
                if p.poll() is not None:
                    print(f"  WARNING: process {i+1} exited with code {p.returncode}")
    except KeyboardInterrupt:
        print("\n  Stopping all services...")
        for p in procs:
            p.terminate()
        for p in procs:
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                p.kill()
        print("  Done.\n")


if __name__ == "__main__":
    main()
