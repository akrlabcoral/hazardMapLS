import asyncio
import copy
import json
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import GRID_PATH
from app.landslide.rainfall_simulation import run_rainfall_simulation
from app.landslide.earthquake_simulation import run_earthquake_simulation
from app.landslide.combined_simulation import run_combined_simulation

router = APIRouter()
logger = logging.getLogger("hazardmap.landslide")

try:
    with open(GRID_PATH) as f:
        _NATIONWIDE_GRID = json.load(f)
except Exception as exc:
    _NATIONWIDE_GRID = None
    logger.error(f"[LandslideRoutes] Failed to load grid: {exc}")

class RainfallInput(BaseModel):
    intensity: float = Field(..., description="Rainfall intensity in mm/day")
    duration: float = Field(..., description="Rainfall duration in days")

class EarthquakeInput(BaseModel):
    magnitude: float = Field(...)
    depth: float = Field(...)
    latitude: float = Field(...)
    longitude: float = Field(...)

class CombinedInput(BaseModel):
    magnitude: float = Field(...)
    depth: float = Field(...)
    latitude: float = Field(...)
    longitude: float = Field(...)
    intensity: float = Field(...)
    duration: float = Field(...)

@router.post("/simulate/rainfall")
async def simulate_rainfall(params: RainfallInput):
    if not _NATIONWIDE_GRID:
        raise HTTPException(500, "Nationwide grid not loaded")
    
    grid = copy.deepcopy(_NATIONWIDE_GRID)
    try:
        result = await asyncio.to_thread(
            run_rainfall_simulation,
            grid=grid,
            intensity=params.intensity,
            duration=params.duration
        )
        return result
    except Exception as exc:
        raise HTTPException(500, str(exc))

@router.post("/simulate/earthquake")
async def simulate_earthquake(params: EarthquakeInput):
    if not _NATIONWIDE_GRID:
        raise HTTPException(500, "Nationwide grid not loaded")
        
    grid = copy.deepcopy(_NATIONWIDE_GRID)
    try:
        result = await asyncio.to_thread(
            run_earthquake_simulation,
            grid=grid,
            magnitude=params.magnitude,
            depth=params.depth,
            lat=params.latitude,
            lon=params.longitude
        )
        return result
    except Exception as exc:
        raise HTTPException(500, str(exc))

@router.post("/simulate/combined")
async def simulate_combined(params: CombinedInput):
    if not _NATIONWIDE_GRID:
        raise HTTPException(500, "Nationwide grid not loaded")
        
    grid = copy.deepcopy(_NATIONWIDE_GRID)
    try:
        result = await asyncio.to_thread(
            run_combined_simulation,
            grid=grid,
            magnitude=params.magnitude,
            depth=params.depth,
            lat=params.latitude,
            lon=params.longitude,
            intensity=params.intensity,
            duration=params.duration
        )
        return result
    except Exception as exc:
        raise HTTPException(500, str(exc))

@router.get("/validation-points")
async def get_validation_points():
    import os
    file_path = "data/landslides/india_landslides_NASA_GSI.geojson"
    if not os.path.exists(file_path):
        return {"type": "FeatureCollection", "features": []}
    with open(file_path, 'r') as f:
        return json.load(f)
