import numpy as np
import copy
from app.landslide.risk_model import rainfall_induced_risk
from app.landslide.raster_engine import LandslideRasterEngine
from app.services.contour_generator import generate_contour_geojson
from app.services.impact_aggregator import aggregate_impact
from app.landslide.validation import LandslideValidator

def run_rainfall_simulation(grid: dict, intensity: float, duration: float) -> dict:
    features = grid["features"]
    lons = np.array([f["properties"]["centroid_lon"] for f in features], dtype=np.float64)
    lats = np.array([f["properties"]["centroid_lat"] for f in features], dtype=np.float64)
    
    raster_engine = LandslideRasterEngine()
    raster_data = raster_engine.get_features(lons, lats)
    
    # User inputs are scalars, we cast them to uniform arrays for the entire grid
    rainfall_arr = np.full(len(lons), intensity * duration, dtype=np.float32)
    hist_density = np.zeros(len(lons), dtype=np.float32) # Future hook for real historical density
    
    risk_arr = rainfall_induced_risk(
        slope=raster_data["slope"],
        rainfall=rainfall_arr,
        soil=raster_data["soil_moisture"],
        hist_density=hist_density
    )
    
    # Annotate features for frontend mapping
    for i, feat in enumerate(features):
        p = feat["properties"]
        p["hazard_probability"] = round(float(risk_arr[i]), 4)
        p["fused_hazard"] = p["hazard_probability"] # For compatibility with Earthquake maps
        
    # We pass risk_arr to contour generator, scaling it to match earthquake conventions if needed
    contour_geojson = generate_contour_geojson(features, risk_arr * 1.0)
    district_summary, state_summary = aggregate_impact(features, risk_arr, risk_arr)
    
    validator = LandslideValidator(features)
    validation_stats = validator.validate(risk_arr)
    
    return {
        "grid_geojson": grid,
        "contour_geojson": contour_geojson,
        "district_summary": district_summary,
        "state_summary": state_summary,
        "validation_stats": validation_stats,
        "max_risk": round(float(np.nanmax(risk_arr)), 4)
    }
