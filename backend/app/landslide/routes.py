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
    intensity: float = Field(50.0, ge=0, le=1000, description="Rainfall intensity in mm/day")
    duration: float = Field(1.0, ge=0.5, le=30, description="Rainfall duration in days")
    is_live: bool = Field(False, description="Fetch live Open-Meteo precipitation forecast")
    target_date_offset: int = Field(0, ge=-3, le=3, description="Target date offset from today (-3 to +3)")

class EarthquakeInput(BaseModel):
    magnitude: float = Field(5.0, ge=1.0, le=9.5)
    depth: float = Field(10.0, ge=1.0, le=700.0)
    latitude: float = Field(22.57, ge=-90, le=90)
    longitude: float = Field(88.36, ge=-180, le=180)

class CombinedInput(BaseModel):
    magnitude: float = Field(5.0, ge=1.0, le=9.5)
    depth: float = Field(10.0, ge=1.0, le=700.0)
    latitude: float = Field(22.57, ge=-90, le=90)
    longitude: float = Field(88.36, ge=-180, le=180)
    intensity: float = Field(50.0, ge=0, le=1000, description="Rainfall intensity in mm/day")
    duration: float = Field(1.0, ge=0.5, le=30, description="Rainfall duration in days")
    is_live: bool = Field(False, description="Fetch live Open-Meteo precipitation forecast")
    target_date_offset: int = Field(0, ge=-3, le=3, description="Target date offset from today (-3 to +3)")

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
            duration=params.duration,
            is_live=params.is_live,
            target_date_offset=params.target_date_offset
        )
        return result
    except Exception as exc:
        logging.exception(f"[Landslide] Rainfall simulation failed: {exc}")
        raise HTTPException(500, "Simulation failed. Please try again later.")

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
        logging.exception(f"[Landslide] Earthquake simulation failed: {exc}")
        raise HTTPException(500, "Simulation failed. Please try again later.")

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
            duration=params.duration,
            is_live=params.is_live,
            target_date_offset=params.target_date_offset
        )
        return result
    except Exception as exc:
        logging.exception(f"[Landslide] Combined simulation failed: {exc}")
        raise HTTPException(500, "Simulation failed. Please try again later.")

@router.get("/validation-points")
async def get_validation_points():
    import os
    file_path = "data/landslides/india_landslides_NASA_GSI.geojson"
    if not os.path.exists(file_path):
        return {"type": "FeatureCollection", "features": []}
    with open(file_path, 'r') as f:
        return json.load(f)
