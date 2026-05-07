# UBID Platform - React Dashboard

An interactive frontend dashboard for the Unified Business Identifier (UBID) Platform, built with React + Vite.

## Features

- **Command Center**: High-level metrics and activity trends
- **Entity Resolution Visualizer**: Node graph showing how records are linked
- **Reviewer Queue**: Side-by-side comparison for ambiguous matches
- **Business Portal**: Self-service lookup by PAN/GSTIN

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Demo Data

Try these in the Business Portal:
- `ABCDE1234F` — Active business with 3 linked records
- `XYZPQ9876G` — Dormant business with 2 linked records

## Tech Stack

- React 19, Vite 8
- Framer Motion (animations)
- Recharts (charts)
- Lucide React (icons)
- Vanilla CSS (dark mode theme)
