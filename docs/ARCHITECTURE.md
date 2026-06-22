# HazardMap Architecture

> **System Design Document** — How HazardMap works under the hood.

---

## Overview

HazardMap is a **scientific geospatial simulation platform** that models natural disasters (earthquake, landslide, heatwave) across India at a 5×5 km spatial resolution. It combines live weather data, physics-based models, and interactive visualization.

---

## System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React/Vite    │────▶│   nginx (prod)   │────▶│  FastAPI (Python)│
│   Frontend      │◀────│   Port 5173      │◀────│  Port 8000      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │                          │
                              │                          ▼
                              │                   ┌─────────────────┐
                              │                   │  PostgreSQL 16  │
                              │                   │  Port 5432      │
                              │                   └─────────────────┘
                              │
                              ▼
                        ┌──────────────────┐
                        │  Open-Meteo API │
                        │  (live weather) │
                        └──────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite + TailwindCSS | UI, map controls, state management |
| Map Engine | MapLibre GL JS | Interactive map rendering, layers |
| Reverse Proxy | nginx | Static file serving, API proxying, SPA routing |
| Backend | FastAPI (Python 3.10+) | REST API, simulation orchestration |
| Scientific | NumPy, SciPy, GeoPandas, Rasterio | Grid interpolation, spatial analysis |
| Database | PostgreSQL 16 (via psycopg2) | Simulation storage, state persistence |
| Live Data | Open-Meteo REST API | Weather forecasts (temp, humidity, precipitation) |
| Live Data | USGS GeoJSON feed | Real-time earthquake events (WebSocket) |
| Container | Docker + Docker Compose | Environment consistency, deployment |

---

## Module Architecture

### Backend Modules (`backend/app/`)

```
app/
├── api/              # Pydantic schemas, REST endpoints (legacy routing)
├── heatwave/         # Heatwave simulation module
│   ├── heatwave_service.py      # Main orchestration
│   ├── heatwave_analysis.py     # WBGT + anomaly physics
│   ├── heatwave_classification.py  # IMD status categories
│   └── heatwave_statistics.py   # District/state aggregation
├── landslide/        # Landslide simulation module
│   ├── combined_simulation.py   # Rainfall + earthquake combined
│   ├── rainfall_simulation.py   # Rainfall-induced landslide
│   ├── earthquake_simulation.py # Seismic landslide
│   ├── live_weather.py          # Open-Meteo precipitation fetch
│   ├── routes.py                # FastAPI endpoints
│   └── raster_engine.py         # DEM/slope/soil raster sampling
├── gis/              # GeoPandas utilities, spatial joins, grid ops
├── services/         # Shared utilities
│   ├── contour_generator.py     # Isoline generation from grid
│   ├── impact_aggregator.py     # District/state summaries
│   └── ...
├── seismic/          # GMPE formulas, PGA calculations
├── soil/             # Vs30 amplification, site classification
├── damage/           # Fragility curves, damage classification
├── layers/           # Map layer abstraction (PGA, soil)
├── jobs/             # Background job queue (async simulations)
├── ingest/           # External data scrapers (NCS, USGS)
├── models/           # Database models, repository pattern
└── main.py           # FastAPI application entry point
```

### Frontend Modules (`frontend/src/`)

```
src/
├── components/
│   ├── MapView.jsx              # Central map component (all layers)
│   ├── modules/
│   │   ├── HeatwaveModule.jsx   # Heatwave controls + results
│   │   └── EarthquakeModule.jsx # Earthquake controls (external team)
│   └── panels/                  # Sidebar panels (landslide, settings, etc.)
├── services/
│   ├── mapLayerService.js       # GIS layer initialization
│   ├── mapLayerManager.js       # Layer CRUD operations
│   ├── rasterService.js         # GeoTIFF rendering
│   └── animationManager.js      # Shockwave animation
├── hooks/
│   ├── useLandslideSimulation.js  # Simulation fetch logic
│   ├── useWebSocket.js            # Live event feed
│   └── useStore.js              # Zustand global state
├── store/
│   └── useStore.js              # Zustand store definition
├── utils/
│   └── geojson/                 # Feature builders, transformers
└── App.jsx                      # Root application component
```

---

## Data Flow

### Simulation Request (Heatwave Example)

```
1. User clicks "Interpolate Live Forecast"
   ↓
2. Frontend POST /scientific-api/heatwave/simulate
   { is_live: true, uhi_enabled: true, duration_days: 3, target_date_offset: 0 }
   ↓
3. Backend: fetch_live_forecast_cached()
   → Open-Meteo API (7-day forecast: -3 past + today + 3 future)
   → Cache result for 5 minutes
   ↓
4. Backend: Grid subsampling (every 2nd cell)
   → Read elevation raster → Interpolate temperature/humidity
   → Calculate WBGT, anomaly, status per cell
   → Generate contour GeoJSON from risk scores
   ↓
5. Backend returns: { forecast: [day1, day2, day3] }
   Each day: { grid_geojson, contour_geojson, district_summary, state_summary }
   ↓
6. Frontend: MapView renders CONTOUR_FILL + CONTOUR_STROKE
   → Smooth color bands based on fused_hazard (0-1)
   → Same rendering pipeline as landslide/earthquake
```

### Simulation Request (Landslide Example)

```
1. User sets rainfall intensity + duration, clicks "Run Sim"
   ↓
2. Frontend POST /scientific-api/landslide/simulate/rainfall
   { intensity: 50, duration: 1, is_live: false, target_date_offset: 0 }
   ↓
3. Backend: Read DEM, slope, soil, historical density
   → Calculate susceptibility + trigger probability
   → Combined risk score per cell
   → Generate contour GeoJSON
   ↓
4. Backend returns: { grid_geojson, contour_geojson, district_summary, state_summary, max_risk }
   ↓
5. Frontend: MapView renders CONTOUR_FILL + CONTOUR_STROKE
   → Same pipeline as heatwave (consistent visual language)
```

---

## Design Decisions

### Why FastAPI + React + Docker?
- **FastAPI**: Python ecosystem for scientific computing (NumPy, SciPy, GeoPandas)
- **React**: Component-based UI, excellent ecosystem for maps (MapLibre)
- **Docker**: Eliminates "works on my machine" problems; single command deployment

### Why MapLibre instead of Mapbox?
- MapLibre is **open-source** and doesn't require API keys
- CARTO basemap tiles are free for research/educational use
- Full WebGL control for custom layers

### Why Contour Rendering for All Simulations?
- **Consistency**: Heatwave, landslide, and earthquake all use the same visual pipeline
- **Smoothness**: Contour bands look professional at all zoom levels
- **Performance**: Backend pre-computes contours; frontend just renders them
- **Clarity**: No blob effect from Gaussian-blurred point heatmaps

### Why Grid Subsampling for Heatwave?
- Heatwave is a **large-scale phenomenon** (100+ km influence)
- 5×5 km resolution is overkill for temperature interpolation
- Subsampling every 2nd cell gives ~10×10 km — still sufficient for visualization
- Reduces computation from ~8,000 cells to ~2,000 cells (4× speedup)

### Why Live Weather Caching?
- Open-Meteo updates forecasts every 6 hours
- Repeated simulation runs don't need fresh API calls within 5 minutes
- Caching reduces latency from 2-5 seconds → instant

---

## External Integration: Earthquake Module

The earthquake simulation is maintained by a **separate team** in a different repository. Integration points:

| Integration Point | Contract |
|-------------------|----------|
| API Endpoint | `POST /api/v1/simulate/earthquake` |
| Request Body | `{ magnitude, depth, latitude, longitude, gmpe_model }` |
| Response | `{ grid_geojson, contour_geojson, district_summary, state_summary }` |
| Shared Utilities | `services/contour_generator.py`, `services/impact_aggregator.py` |
| Shared Layer | `SIM_LAYERS.CONTOUR_FILL`, `SIM_LAYERS.CONTOUR_STROKE` |

**Integration Strategy:**
1. The earthquake module will be merged as `backend/app/earthquake/`
2. It follows the same pattern as `landslide/` and `heatwave/`
3. Shared services remain in `backend/app/services/`
4. Frontend renders earthquake results via the same `CONTOUR_FILL` pipeline

---

## Database Schema (High-Level)

```sql
-- Simulations table
CREATE TABLE simulations (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50),           -- 'earthquake', 'landslide', 'heatwave', 'combined'
    params JSONB,               -- Input parameters
    results JSONB,              -- Summary results (district, state)
    grid_geojson_id UUID,       -- Reference to stored GeoJSON
    created_at TIMESTAMP DEFAULT NOW()
);

-- Historical events (for validation)
CREATE TABLE historical_events (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50),
    location GEOGRAPHY(POINT),
    date DATE,
    magnitude FLOAT,
    deaths INT,
    source TEXT
);
```

---

## Performance Considerations

| Bottleneck | Mitigation |
|------------|-----------|
| Open-Meteo API latency | 5-minute in-memory cache |
| `griddata` interpolation | Subsample grid (2× or 5×) |
| `copy.deepcopy` of 8,000 features | Shallow property copy |
| Contour generation | Backend pre-computes, frontend renders |
| Docker image size | Multi-stage build (node → nginx) |
| 504 Gateway Timeout | nginx proxy timeout: 300s |

---

## Security Considerations

- `.env` files are never committed to git (use `.env.example`)
- PostgreSQL password must be changed in production
- CORS origins are explicitly whitelisted
- No sensitive data in frontend build (all env vars are build-time)
- nginx serves only static files and proxies API calls — no direct backend exposure

---

## Future Roadmap

| Feature | Status | Notes |
|---------|--------|-------|
| Earthquake module | 🔜 In separate repo | Team integration pending |
| Flood simulation | 🔜 Planned | Requires river gauge data |
| Cyclone tracking | 🔜 Planned | Requires IMD cyclone feed |
| Real-time alert system | 🔜 Planned | Push notifications + SMS |
| PostGIS migration | 🔜 Planned | For advanced spatial queries |
| Multi-user support | 🔜 Planned | Authentication + role-based access |

---

*Last updated: 2025-06-22*
