import asyncio
import copy
import json
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import GRID_PATH
from app.heatwave.heatwave_service import run_heatwave_simulation

router = APIRouter()
logger = logging.getLogger("hazardmap.heatwave")

try:
    with open(GRID_PATH) as f:
        _NATIONWIDE_GRID = json.load(f)
except Exception as exc:
    _NATIONWIDE_GRID = None
    logger.error(f"[HeatwaveRoutes] Failed to load grid: {exc}")

class HeatwaveInput(BaseModel):
    apparent_temperature: float = Field(40.0, description="Apparent Temperature (Thermal Comfort Index) in Celsius (if not live)")
    duration_days: int = Field(5, ge=1, le=5, description="Days to forecast")
    is_live: bool = Field(True, description="Fetch live Open-Meteo data")
    uhi_enabled: bool = Field(False, description="Apply Urban Heat Island penalty")
    target_date_offset: int = Field(0, ge=-3, le=3, description="Target date offset from today (-3 to +3)")

@router.post("/simulate")
async def simulate_heatwave(params: HeatwaveInput):
    if not _NATIONWIDE_GRID:
        raise HTTPException(500, "Nationwide grid not loaded")
    
    grid = copy.deepcopy(_NATIONWIDE_GRID)
    try:
        result = await asyncio.to_thread(
            run_heatwave_simulation,
            grid=grid,
            is_live=params.is_live,
            uhi_enabled=params.uhi_enabled,
            duration_days=params.duration_days,
            apparent_temperature=params.apparent_temperature,
            target_date_offset=params.target_date_offset
        )
        return result
    except Exception as exc:
        raise HTTPException(500, str(exc))
