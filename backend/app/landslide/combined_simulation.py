import numpy as np
import copy
from app.landslide.risk_model import combined_induced_risk
from app.landslide.raster_engine import LandslideRasterEngine
from app.layers.pga.engine import PGAEngine
from app.layers.pga.selector import GMPESelector
from app.services.contour_generator import generate_contour_geojson
from app.services.impact_aggregator import aggregate_impact
from app.landslide.validation import LandslideValidator

def run_combined_simulation(
    grid: dict,
    magnitude: float,
    depth: float,
    lat: float,
    lon: float,
    intensity: float,
    duration: float,
    is_live: bool = False,
    target_date_offset: int = 0
) -> dict:
    # Run the PGA calculation first on the whole grid to determine the physically affected area
    gmpe, _ = GMPESelector.select(lat, lon, None)
    pga_engine = PGAEngine()
    full_raw_pga = pga_engine.compute(grid["features"], magnitude, lat, lon, depth, gmpe)
    
    # Filter grid by perceptible PGA threshold (>= 0.01g)
    mask = full_raw_pga >= 0.01
    features = [grid["features"][i] for i in range(len(grid["features"])) if mask[i]]
    grid["features"] = features
    raw_pga = full_raw_pga[mask]
    
    if not features:
        return {"grid_geojson": grid, "contour_geojson": None, "historical_geojson": None, "district_summary": {}, "state_summary": {}, "max_risk": 0.0, "validation_stats": {}}
        
    lons = np.array([f["properties"]["centroid_lon"] for f in features], dtype=np.float64)
    lats = np.array([f["properties"]["centroid_lat"] for f in features], dtype=np.float64)
    
    raster_engine = LandslideRasterEngine()
    raster_data = raster_engine.get_features(features, lons, lats)
    validator = LandslideValidator(features)
    hist_density = validator.historical_density()
    
    if is_live:
        import logging
        logger = logging.getLogger("hazardmap.landslide")
        from app.landslide.live_weather import get_interpolated_precipitation
        logger.info(f"[CombinedSim] Fetching LIVE precipitation forecast (offset {target_date_offset} days)...")
        interpolated_intensity = get_interpolated_precipitation(lons, lats, target_date_offset)
        intensity_hr = np.array(interpolated_intensity / 24.0, dtype=np.float32)
        duration_hr = 1.0 * 24.0
    else:
        intensity_hr = np.full(len(lons), intensity / 24.0, dtype=np.float32)
        duration_hr = duration * 24.0
    
    risk_arr, susceptibility_arr, trigger_arr = combined_induced_risk(
        slope=raster_data["slope"],
        intensity=intensity_hr,
        duration=duration_hr,
        pga=raw_pga,
        soil=raster_data["soil_moisture"],
        elevation=raster_data["elevation"],
        lats=lats,
        lons=lons,
        hist_density=hist_density
    )
    
    for i, feat in enumerate(features):
        p = feat["properties"]
        p["hazard_probability"] = round(float(risk_arr[i]), 4)
        p["susceptibility"] = round(float(susceptibility_arr[i]), 4)
        p["trigger_probability"] = round(float(trigger_arr[i]), 4)
        p["fused_hazard"] = p["hazard_probability"]
        p["historical_density"] = round(float(hist_density[i]), 4)
        
    # We pass risk_arr to contour generator using Landslide specific levels
    from app.config import LANDSLIDE_LEVELS, LANDSLIDE_COLORS
    contour_geojson = generate_contour_geojson(
        features, 
        risk_arr, 
        levels=LANDSLIDE_LEVELS, 
        colors=LANDSLIDE_COLORS
    )
    
    district_summary, state_summary = aggregate_impact(features, raw_pga, risk_arr)
    
    validation_stats = validator.validate(risk_arr)
    max_risk_val = float(np.nanmax(risk_arr)) if len(risk_arr) > 0 else 0.0
    
    return {
        "grid_geojson": grid,
        "contour_geojson": contour_geojson,
        "historical_geojson": validator.get_geojson(),
        "district_summary": district_summary,
        "state_summary": state_summary,
        "validation_stats": validation_stats,
        "max_risk": round(max_risk_val, 4)
    }
