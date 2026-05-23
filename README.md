<div align="center">

# 🌍 HazardMap

**Disaster Response & Evacuation Planning Platform**

*Real-time earthquake simulation, hazard visualization, and geospatial analysis for emergency coordinators.*

![License](https://img.shields.io/badge/license-ISC-blue) ![Node](https://img.shields.io/badge/node-22-green) ![PostGIS](https://img.shields.io/badge/database-PostGIS-blue) ![MapLibre](https://img.shields.io/badge/maps-MapLibre%20GL%20JS-purple)

</div>

---

## Overview

HazardMap is a full-stack geospatial web platform for disaster response coordination. It provides:

- **Interactive earthquake simulation** — set an epicenter, magnitude, and depth; visualize hazard zones, damaged buildings, and blocked roads with an animated shockwave
- **Multi-layer GIS visualization** — superimpose satellite, terrain, hospital, shelter, and road network layers with independent opacity controls
- **Raster data overlays** — soil composition, precipitation, flood risk, elevation, vegetation, and population density
- **PostGIS backend** — spatial database ready for real-world evacuation routing and proximity queries
- **WebSocket infrastructure** — real-time simulation broadcast scaffolding (ready to activate)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  React Frontend (Vite, port 5173)                       │
│   • MapLibre GL JS  — interactive map rendering         │
│   • Zustand         — reactive state management         │
│   • Framer Motion   — UI animations                     │
│   • Turf.js         — client-side GIS geometry          │
└──────────────────────┬──────────────────────────────────┘
                       │  REST /api/*  (Vite proxy in dev)
                       │  WebSocket ws://localhost:5000
┌──────────────────────▼──────────────────────────────────┐
│  Express API (Node.js, port 5000)                       │
│   • REST routes: earthquakes, shelters, hospitals       │
│   • POST /api/simulate — server-side simulation engine  │
│   • WebSocket server (ws) — real-time event broadcast   │
└──────────────────────┬──────────────────────────────────┘
                       │  node-postgres connection pool
┌──────────────────────▼──────────────────────────────────┐
│  PostgreSQL 16 + PostGIS 3.4                            │
│   • Spatial tables: shelters, hospitals, incidents,     │
│     blocked_roads, rescue_teams, hazard_zones           │
│   • GIST spatial indices on all geometry columns        │
│   • ST_DWithin for proximity search (meters-accurate)   │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
HazardMap/
├── src/                         # React frontend
│   ├── components/              # UI components (Sidebar, MapView, etc.)
│   ├── pages/                   # Route-level pages (Dashboard)
│   ├── services/                # Business logic (simulation, layers, raster)
│   │   ├── simulationEngine.js  # Earthquake simulation — shared with server
│   │   ├── mapLayerService.js   # MapLibre layer lifecycle manager
│   │   ├── layerManager.js      # Layer + raster configuration registry
│   │   ├── rasterService.js     # Raster overlay rendering
│   │   └── geoJsonLoader.js     # Fetch GeoJSON from /public/data/
│   └── store/
│       └── useStore.js          # Zustand global state
│
├── server/                      # Express backend
│   ├── src/
│   │   ├── index.js             # Entry point (HTTP + WebSocket server)
│   │   ├── config/db.js         # PostgreSQL connection pool
│   │   ├── middleware/          # logger.js, errorHandler.js
│   │   ├── routes/              # earthquakes, shelters, hospitals, simulate
│   │   ├── scripts/             # migrate.js, seed.js
│   │   └── utils/               # geojsonHelper.js
│   ├── migrations/              # SQL schema (PostGIS tables + GIST indices)
│   ├── seeds/                   # Kolkata-area sample data
│   ├── Dockerfile               # API container
│   └── .env.example             # Environment variable template
│
├── public/data/                 # Static GeoJSON (used when DB is offline)
├── scripts/                     # Developer utilities
│   └── generateData.cjs         # Regenerate mock GeoJSON → npm run generate-data
│
├── docker-compose.yml           # Full-stack orchestration (DB + API)
├── vite.config.js               # Vite + /api proxy
└── README.md                    # This file
```

---

## Quick Start

### Prerequisites

- Node.js 22+
- Docker & Docker Compose (for database)

### 1. Clone and install

```bash
git clone <repo-url>
cd HazardMap

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
# Edit server/.env if your DB credentials differ from defaults
```

### 3. Start the database

```bash
# Starts PostgreSQL + PostGIS with schema and seed data auto-loaded
docker compose up -d postgres
```

### 4. Start the backend API

```bash
npm run server:dev
# API running at http://localhost:5000
```

### 5. Start the frontend

```bash
npm run dev
# App running at http://localhost:5173
```

---

## API Reference

| Method | Endpoint | Description | Key Query Params |
|---|---|---|---|
| `GET` | `/api/health` | Health check | — |
| `GET` | `/api/earthquakes` | Historical earthquakes (GeoJSON) | `magnitude_min`, `magnitude_max`, `limit` |
| `GET` | `/api/shelters` | Emergency shelters (GeoJSON) | `lng`, `lat`, `radius` (meters), `status` |
| `GET` | `/api/hospitals` | Hospitals (GeoJSON) | `lng`, `lat`, `radius`, `emergency_level` |
| `POST` | `/api/simulate` | Run earthquake simulation | Body: `{ epicenter, magnitude, depth, aftershocks }` |

### Example: Find shelters within 5km of Kolkata

```bash
curl "http://localhost:5000/api/shelters?lng=88.36&lat=22.57&radius=5000"
```

### Example: Run simulation

```bash
curl -X POST http://localhost:5000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"epicenter":{"lng":88.36,"lat":22.57},"magnitude":6.5,"depth":10,"aftershocks":true}'
```

---

## Docker (Full Stack)

```bash
# Start everything (DB + API) from project root
docker compose up -d

# Rebuild API after code changes
docker compose up -d --build api

# Tear down (keeps DB data volume)
docker compose down

# Tear down and wipe database
docker compose down -v
```

---

## Developer Utilities

```bash
# Regenerate all mock GeoJSON files in public/data/
npm run generate-data

# Run database migrations manually
npm run server:migrate

# Seed the database with Kolkata-area sample data
npm run server:seed
```

---

## Future Roadmap

| Capability | Integration Point | Status |
|---|---|---|
| Real-time simulation broadcast | `broadcast()` in `server/src/index.js` | 🔲 Scaffolded |
| Evacuation route-finding | pgRouting + `GET /api/routes` | 🔲 Planned |
| Live seismic feed (USGS/IMD) | Background job → WebSocket | 🔲 Planned |
| AI building vulnerability scoring | Python FastAPI microservice | 🔲 Planned |
| Cloud Optimized GeoTIFF (COG) | PostGIS Raster / gdal-js | 🔲 Planned |
| Satellite change detection | Remote sensing pipeline | 🔲 Planned |

---

## Security Notes

- **Never commit `.env` files.** Use `.env.example` as the template.
- The root `.gitignore` blocks `node_modules/`, `dist/`, `.env`, and `.DS_Store`.
- API credentials should be stored in a secrets manager (AWS Secrets Manager, HashiCorp Vault) for production deployments.
- All SQL queries use parameterized statements (`$1`, `$2`) — no string interpolation, preventing SQL injection.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + Vite 8 |
| Map rendering | MapLibre GL JS 5 |
| Client-side GIS | Turf.js 7 |
| State management | Zustand 5 |
| Animations | Framer Motion 12 |
| Styling | Tailwind CSS 4 |
| Backend | Node.js 22 + Express 5 |
| Real-time | WebSocket (`ws`) |
| Database | PostgreSQL 16 + PostGIS 3.4 |
| Containerization | Docker + Docker Compose |
