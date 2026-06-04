import numpy as np
import copy
from app.landslide.risk_model import combined_induced_risk
from app.landslide.raster_engine import LandslideRasterEngine
from app.layers.pga.engine import PGAEngine
from app.layers.pga.selector import GMPESelector
from app.services.contour_generator import generate_contour_geojson
from app.services.impact_aggregator import aggregate_impact
from app.landslide.validation import LandslideValidator

def run_combined_simulation(grid: dict, magnitude: float, depth: float, lat: float, lon: float, intensity: float, duration: float) -> dict:
    features = grid["features"]
    lons = np.array([f["properties"]["centroid_lon"] for f in features], dtype=np.float64)
    lats = np.array([f["properties"]["centroid_lat"] for f in features], dtype=np.float64)
    
    gmpe, _ = GMPESelector.select(lat, lon, None)
    pga_engine = PGAEngine()
    raw_pga = pga_engine.compute(features, magnitude, lat, lon, depth, gmpe)
    
    raster_engine = LandslideRasterEngine()
    raster_data = raster_engine.get_features(lons, lats)
    
    rainfall_arr = np.full(len(lons), intensity * duration, dtype=np.float32)
    
    risk_arr = combined_induced_risk(
        slope=raster_data["slope"],
        rainfall=rainfall_arr,
        pga=raw_pga,
        soil=raster_data["soil_moisture"],
        elevation=raster_data["elevation"]
    )
    
    for i, feat in enumerate(features):
        p = feat["properties"]
        p["hazard_probability"] = round(float(risk_arr[i]), 4)
        p["fused_hazard"] = p["hazard_probability"]
        
    contour_geojson = generate_contour_geojson(features, risk_arr)
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
