"""
app/main.py

FastAPI application entry point.

Lifespan manages:
  - Soil raster preloading
  - USGS poller asyncio task
  - Simulation worker asyncio task
  - Daily DB cleanup task
  - DB connection pool shutdown
"""
from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import simulate, export, alerts
from app.api import ws as ws_module
from app.api import events as events_module
from app.soil import cache as soil_cache
from app.soil.loader import load_all_soil_rasters
from app.models.repository import close_pool, cleanup_old_data
from app.ingest.poller import run_poller, run_ncs_poller
from app.ingest.predictions import run_predictions_poller
from app.jobs.queue import run_worker, get_queue


logger = logging.getLogger(__name__)

async def _run_daily_cleanup() -> None:
    """Runs cleanup_old_data() every 24 hours in the background."""
    while True:
        await asyncio.sleep(24 * 60 * 60)
        try:
            await asyncio.to_thread(cleanup_old_data)
            logger.info("[Cleanup] Daily DB cleanup complete.")
        except Exception as exc:
            logger.warning(f"[Cleanup] DB cleanup failed: {type(exc).__name__}")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)

_bg_tasks: list[asyncio.Task] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────
    logger.info("[Startup] Loading USDA soil rasters...")
    load_all_soil_rasters()
    logger.info("[Startup] Soil raster loading complete.")

    queue = get_queue()

    # Start background tasks
    usgs_poller_task = asyncio.create_task(run_poller(queue),      name="usgs_poller")
    ncs_poller_task  = asyncio.create_task(run_ncs_poller(queue),  name="ncs_poller")
    predictions_task = asyncio.create_task(run_predictions_poller(queue), name="predictions_poller")
    worker_task      = asyncio.create_task(run_worker(),           name="ws_worker")
    cleanup_task     = asyncio.create_task(_run_daily_cleanup(),   name="db_cleanup")
    
    _bg_tasks.extend([usgs_poller_task, ncs_poller_task, predictions_task, worker_task, cleanup_task])
    logger.info("[Startup] USGS poller, NCS poller, simulation worker, and daily cleanup task started.")

    yield

    # ── Shutdown ─────────────────────────────────────────────────────
    logger.info("[Shutdown] Cancelling background tasks...")
    for task in _bg_tasks:
        task.cancel()
    await asyncio.gather(*_bg_tasks, return_exceptions=True)

    logger.info("[Shutdown] Closing soil raster handles...")
    soil_cache.close_all()

    logger.info("[Shutdown] Closing DB connection pool...")
    close_pool()


app = FastAPI(
    title="HazardMap Scientific Earthquake Engine",
    version="3.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# In production, set CORS_ALLOWED_ORIGINS env var to your frontend domain(s).
# Example: CORS_ALLOWED_ORIGINS=https://hazardmap.vercel.app,https://yourdomain.com
# Falls back to localhost for local development.
_raw_origins = os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Accept"],
)

app.include_router(simulate.router, prefix="/api", tags=["Simulate"])
app.include_router(export.router, prefix="/api", tags=["Export"])
app.include_router(ws_module.router, prefix="/api", tags=["WebSocket"])
app.include_router(events_module.router, prefix="/api", tags=["Events"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])

from app.landslide import routes as landslide_routes
app.include_router(landslide_routes.router, prefix="/api/landslide")

from app.heatwave import routes as heatwave_routes
app.include_router(heatwave_routes.router, prefix="/api/heatwave")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
