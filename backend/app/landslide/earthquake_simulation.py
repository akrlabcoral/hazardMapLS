import numpy as np
import copy
from app.landslide.risk_model import earthquake_induced_risk
from app.landslide.raster_engine import LandslideRasterEngine
from app.layers.pga.engine import PGAEngine
from app.layers.pga.selector import GMPESelector
from app.services.contour_generator import generate_contour_geojson
from app.services.impact_aggregator import aggregate_impact
from app.landslide.validation import LandslideValidator

def run_earthquake_simulation(grid: dict, magnitude: float, depth: float, lat: float, lon: float) -> dict:
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
    
    # Load Landslide Rasters
    raster_engine = LandslideRasterEngine()
    raster_data = raster_engine.get_features(features, lons, lats, include_elevation=True)
    validator = LandslideValidator(features)
    hist_density = validator.historical_density()
    
    risk_arr, susceptibility_arr, trigger_arr = earthquake_induced_risk(
        slope=raster_data["slope"],
        pga=raw_pga,
        soil=raster_data["soil_moisture"],
        elevation=raster_data["elevation"],
        hist_density=hist_density
    )
    
    # Annotate features
    for i, feat in enumerate(features):
        p = feat["properties"]
        p["hazard_probability"] = round(float(risk_arr[i]), 4)
        p["susceptibility"] = round(float(susceptibility_arr[i]), 4)
        p["trigger_probability"] = round(float(trigger_arr[i]), 4)
        p["fused_hazard"] = p["hazard_probability"]
        p["historical_density"] = round(float(hist_density[i]), 4)
        p["pga_base"] = round(float(raw_pga[i]), 4) # Optional: preserve original PGA for debugging
        
    from app.config import LANDSLIDE_LEVELS, LANDSLIDE_COLORS
    contour_geojson = generate_contour_geojson(
        features, 
        risk_arr, 
        levels=LANDSLIDE_LEVELS, 
        colors=LANDSLIDE_COLORS
    )
    district_summary, state_summary = aggregate_impact(features, raw_pga, risk_arr)
    
    validation_stats = validator.validate(risk_arr)
    
    return {
        "grid_geojson": grid,
        "contour_geojson": contour_geojson,
        "historical_geojson": validator.get_geojson(),
        "district_summary": district_summary,
        "state_summary": state_summary,
        "validation_stats": validation_stats,
        "max_risk": round(float(np.nanmax(risk_arr)), 4)
    }
