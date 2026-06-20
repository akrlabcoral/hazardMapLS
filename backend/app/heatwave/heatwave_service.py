"""
app/heatwave/heatwave_service.py

Orchestrates the heatwave simulation using Live Weather Interpolation.
"""
import os
import json
import numpy as np
import requests
import copy
from datetime import datetime
from scipy.interpolate import griddata
from app.landslide.raster_engine import LandslideRasterEngine
from app.services.contour_generator import generate_contour_geojson
from app.heatwave.heatwave_analysis import calculate_wbgt_and_anomaly
from app.heatwave.heatwave_classification import classify_heatwave, get_risk_score
from app.heatwave.heatwave_statistics import generate_statistics

BASELINE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "heatwave_baseline.json")

def fetch_live_forecast(cities):
    lats = ",".join([str(c["lat"]) for c in cities])
    lons = ",".join([str(c["lon"]) for c in cities])
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lats}&longitude={lons}&daily=temperature_2m_max,relative_humidity_2m_mean&timezone=Asia/Kolkata&past_days=3&forecast_days=4"
    
    r = requests.get(url, timeout=20)
    if r.status_code != 200:
        raise Exception("Failed to fetch live forecast")
    data = r.json()
    if not isinstance(data, list):
        data = [data]
    return data

def run_heatwave_simulation(
    grid: dict,
    is_live: bool,
    uhi_enabled: bool,
    duration_days: int,
    temperature: float = 40.0,
    humidity: float = 50.0,
    target_date_offset: int = 0
) -> dict:
    if not os.path.exists(BASELINE_PATH):
        raise Exception("Baseline data missing. Run build_climate_baseline.py first.")
        
    with open(BASELINE_PATH) as f:
        baseline_cities = json.load(f)
        
    features = grid["features"]
    lons = np.array([f["properties"]["centroid_lon"] for f in features], dtype=np.float64)
    lats = np.array([f["properties"]["centroid_lat"] for f in features], dtype=np.float64)
    
    # Elevation
    raster_engine = LandslideRasterEngine()
    elevation_data = raster_engine._sample_raster(raster_engine.elev_path, lons, lats, nodata_val=0.0)
    elevation = np.nan_to_num(elevation_data, nan=0.0)
    
    # Urban Mask (Synthesize from reference cities + standard radius)
    # 0.2 degrees ≈ 22 km at the equator, ~20 km at Indian latitudes (~22°N)
    UHI_RADIUS_DEG = 0.2
    urban_mask = np.zeros_like(lons)
    if uhi_enabled:
        for c in baseline_cities:
            dist = np.sqrt((lons - c["lon"])**2 + (lats - c["lat"])**2)
            urban_mask[dist < UHI_RADIUS_DEG] = 1.0
            
    # Calculate baseline normal temps for current month
    current_month = str(datetime.now().month)
    base_coords = []
    base_temps = []
    
    for c in baseline_cities:
        base_coords.append([c["lon"], c["lat"]])
        base_temps.append(c["monthly_normals"][current_month])
        
    base_coords = np.array(base_coords)
    baseline_temp = griddata(base_coords, np.array(base_temps), (lons, lats), method='linear')
    if np.isnan(baseline_temp).any():
        baseline_temp_near = griddata(base_coords, np.array(base_temps), (lons, lats), method='nearest')
        baseline_temp[np.isnan(baseline_temp)] = baseline_temp_near[np.isnan(baseline_temp)]

    # Fetch Forecast Data
    if is_live:
        forecast_data = fetch_live_forecast(baseline_cities)
    else:
        forecast_data = None
        
    daily_results = []
    num_days = min(5, duration_days)
    
    # The forecast array has 7 days: [-3, -2, -1, 0, 1, 2, 3]
    # Index 0 corresponds to -3. Index 3 is today (0).
    start_index = target_date_offset + 3
    if start_index < 0: start_index = 0
    if start_index > 6: start_index = 6
    
    for day_idx in range(num_days):
        forecast_day_index = start_index + day_idx
        if forecast_day_index > 6:
            break
        
        live_coords = []
        live_temps = []
        live_hums = []
        
        for i, c in enumerate(baseline_cities):
            if forecast_data:
                d = forecast_data[i]["daily"]
                if forecast_day_index < len(d["temperature_2m_max"]):
                    t = d["temperature_2m_max"][forecast_day_index]
                    h = d["relative_humidity_2m_mean"][forecast_day_index]
                else:
                    t = None
                    h = None
                if t is None: t = 35.0
                if h is None: h = 50.0
            else:
                t = temperature
                h = humidity
            
            live_coords.append([c["lon"], c["lat"]])
            live_temps.append(t)
            live_hums.append(h)
            
        live_coords = np.array(live_coords)
        live_temp = griddata(live_coords, np.array(live_temps), (lons, lats), method='linear')
        live_hum = griddata(live_coords, np.array(live_hums), (lons, lats), method='linear')
        
        if np.isnan(live_temp).any():
            live_temp[np.isnan(live_temp)] = griddata(live_coords, np.array(live_temps), (lons, lats), method='nearest')[np.isnan(live_temp)]
        if np.isnan(live_hum).any():
            live_hum[np.isnan(live_hum)] = griddata(live_coords, np.array(live_hums), (lons, lats), method='nearest')[np.isnan(live_hum)]
            
        # Physics Engine
        wbgt, anomaly, adj_live_temp = calculate_wbgt_and_anomaly(
            live_temp=live_temp,
            live_humidity=live_hum,
            baseline_temp=baseline_temp,
            elevation=elevation,
            duration_days=(day_idx + 1),
            urban_mask=urban_mask
        )
        
        risk_arr = np.zeros_like(wbgt)
        day_features = copy.deepcopy(features)
        
        for i, feat in enumerate(day_features):
            p = feat["properties"]
            w = float(wbgt[i])
            a = float(anomaly[i])
            t = float(adj_live_temp[i])
            
            status = classify_heatwave(w, a, t, float(elevation[i]))
            risk_score = get_risk_score(status)
            
            p["temperature"] = round(t, 1)
            p["wbgt"] = round(w, 1)
            p["anomaly"] = round(a, 1)
            p["status"] = status
            p["hazard_probability"] = risk_score
            p["fused_hazard"] = risk_score
            risk_arr[i] = risk_score
            
        contour_geojson = generate_contour_geojson(day_features, risk_arr)
        district_summary, state_summary = generate_statistics(day_features)
        
        daily_results.append({
            "day": day_idx + 1,
            "grid_geojson": {"type": "FeatureCollection", "features": day_features},
            "contour_geojson": contour_geojson,
            "district_summary": district_summary,
            "state_summary": state_summary,
            "max_risk": round(float(np.nanmax(risk_arr)), 4)
        })
        
    return {"forecast": daily_results}
