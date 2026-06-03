from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.gis.boundary import is_epicenter_valid
from app.gis.grid import calculate_impacts
from app.models.repository import save_simulation

router = APIRouter()

class EarthquakeInput(BaseModel):
    magnitude: float = Field(..., ge=3.0, le=9.5, description="Magnitude between 3 and 9.5")
    depth: float = Field(..., gt=0, le=700, description="Depth in km, must be greater than 0 and less than 700")
    latitude: float = Field(..., description="Epicenter latitude")
    longitude: float = Field(..., description="Epicenter longitude")
    gmpe_model: str = Field("indian_shield", description="GMPE Model: himalayan, continental, or indian_shield")

@router.post("/simulate-earthquake")
def simulate_earthquake(params: EarthquakeInput):
    # 1. Validate boundary (inside India or within 100km)
    if not is_epicenter_valid(params.latitude, params.longitude):
        raise HTTPException(
            status_code=400, 
            detail="Epicenter must be inside India or within 100km of the Indian boundary."
        )

    # 2. Calculate scientific impacts for West Bengal grid
    try:
        results = calculate_impacts(
            lat=params.latitude, 
            lon=params.longitude, 
            mag=params.magnitude, 
            depth=params.depth,
            gmpe_model=params.gmpe_model
        )
        
        # 3. Save simulation history
        sim_id = save_simulation(
            lat=params.latitude, 
            lon=params.longitude, 
            mag=params.magnitude, 
            depth=params.depth,
            district_summary=results["district_summary"]
        )
        
        results["simulation_id"] = sim_id
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
