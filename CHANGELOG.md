# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Live weather integration via Open-Meteo API (heatwave + landslide precipitation)
- Target date offset slider (-3 to +3 days from today)
- `live_weather.py` service for spatial precipitation interpolation
- Heatwave performance optimizations (grid subsampling, forecast caching, deepcopy removal)
- Nginx production Dockerfile with API proxy configuration
- 300-second timeout for heavy simulation endpoints
- Silent WebSocket connection (no retry spam)
- Pydantic `ge`/`le` constraints on all API input models
- `.env.example`, `Makefile`, `CONTRIBUTING.md`, `LICENSE`

### Fixed
- Git repository corruption (re-initialized from origin)
- 93 tracked `__pycache__` / `.pyc` files removed from git
- 5.3MB `response.json` removed from git tracking
- `duration_days` parameter ignored in heatwave simulation
- Independent NaN handling for temperature and humidity
- `aggregate_impact` NaN crash on empty risk arrays
- Empty string crash in LandslidePanel rainfall inputs
- AbortController leak in `useLandslideSimulation`
- 504 Gateway Timeout on heatwave simulations
- Heatwave rendering (contour-based, same as landslide/earthquake)

### Changed
- Frontend Dockerfile: Vite dev server → multi-stage nginx build
- `.gitignore`: deduplicated, added `response.json`
- `README.md`: added Docker Compose quick-start guide

## [0.9.0] - 2025-06-20

### Added
- Initial heatwave simulation module with live weather interpolation
- Landslide combined simulation (rainfall + earthquake)
- IMD-based heatwave classification (Normal, Warm, Heatwave, Severe, Extreme)
- WBGT (Wet Bulb Globe Temperature) physics engine
- Urban Heat Island (UHI) penalty modeling
- District and state-level statistical summaries
- Real-time USGS earthquake event feed via WebSocket
- MapLibre GL JS interactive map with dark/light themes
- Soil amplification layer (Vs30 site classification)
- Historical landslide validation points overlay

### Fixed
- Backend grid interpolation edge cases
- Frontend simulation state clearing
- Map layer visibility synchronization

## [0.8.0] - 2025-05-15

### Added
- Earthquake PGA simulation with multiple GMPE models
- Seismic landslide susceptibility overlay
- Contour generation for smooth hazard visualization
- State boundary choropleth with hover effects
- Epicenter shockwave animation
- CSV/JSON export for simulation results

## [0.7.0] - 2025-04-01

### Added
- Initial nationwide 5×5 km spatial grid for India
- PostgreSQL database for simulation storage
- FastAPI backend with modular domain architecture
- React + Vite frontend with Zustand state management
- Docker Compose orchestration
