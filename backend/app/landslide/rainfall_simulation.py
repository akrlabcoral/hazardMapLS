import numpy as np
import copy
import logging
import time
from app.landslide.risk_model import rainfall_induced_risk
from app.landslide.raster_engine import LandslideRasterEngine
from app.services.contour_generator import generate_contour_geojson
from app.services.impact_aggregator import aggregate_impact
from app.landslide.validation import LandslideValidator

logger = logging.getLogger("hazardmap.landslide")

def run_rainfall_simulation(
    grid: dict,
    intensity: float,
    duration: float,
    is_live: bool = False,
    target_date_offset: int = 0
) -> dict:
    t_start = time.monotonic()
    features = grid["features"]
    lons = np.array([f["properties"]["centroid_lon"] for f in features], dtype=np.float64)
    lats = np.array([f["properties"]["centroid_lat"] for f in features], dtype=np.float64)
    
    raster_engine = LandslideRasterEngine()
    # Read elevation and slopes instantly from the cached json!
    raster_data = raster_engine.get_features(features, lons, lats, include_elevation=True)
    validator = LandslideValidator(features)
    
    if is_live:
        from app.landslide.live_weather import get_interpolated_precipitation
        logger.info(f"[RainfallSim] Fetching LIVE precipitation forecast (offset {target_date_offset} days)...")
        interpolated_intensity = get_interpolated_precipitation(lons, lats, target_date_offset)
        intensity_hr = np.array(interpolated_intensity / 24.0, dtype=np.float32)
        duration_hr = 1.0 * 24.0  # We fetched 1 day's total average
    else:
        # UI inputs are in days and mm/day. The empirical formulas require hours and mm/hour.
        intensity_hr = np.full(len(lons), intensity / 24.0, dtype=np.float32)
        duration_hr = duration * 24.0
    
    hist_density = validator.historical_density()
    
    risk_arr, susceptibility_arr, trigger_arr = rainfall_induced_risk(
        slope=raster_data["slope"],
        intensity=intensity_hr,
        duration=duration_hr,
        soil=raster_data["soil_moisture"],
        elevation=raster_data["elevation"],
        hist_density=hist_density,
        lats=lats,
        lons=lons
    )
    
    # Annotate features for frontend mapping
    for i, feat in enumerate(features):
        p = feat["properties"]
        p["hazard_probability"] = round(float(risk_arr[i]), 4)
        p["susceptibility"] = round(float(susceptibility_arr[i]), 4)
        p["trigger_probability"] = round(float(trigger_arr[i]), 4)
        p["fused_hazard"] = p["hazard_probability"] # For compatibility with Earthquake maps
        p["historical_density"] = round(float(hist_density[i]), 4)
        
    # We pass risk_arr to contour generator using Landslide specific levels
    from app.config import LANDSLIDE_LEVELS, LANDSLIDE_COLORS
    contour_geojson = generate_contour_geojson(
        features, 
        risk_arr, 
        levels=LANDSLIDE_LEVELS, 
        colors=LANDSLIDE_COLORS
    )
    
    district_summary, state_summary = aggregate_impact(features, risk_arr, risk_arr)
    
    validation_stats = validator.validate(risk_arr)
    max_risk_val = float(np.nanmax(risk_arr)) if len(risk_arr) > 0 else 0.0
    logger.info(
        "[LandslideRainfall] completed cells=%s duration_ms=%s",
        len(features),
        int((time.monotonic() - t_start) * 1000),
    )
    
    return {
        "grid_geojson": grid,
        "contour_geojson": contour_geojson,
        "historical_geojson": validator.get_geojson(),
        "district_summary": district_summary,
        "state_summary": state_summary,
        "validation_stats": validation_stats,
        "max_risk": round(max_risk_val, 4)
    }
