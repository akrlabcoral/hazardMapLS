import os
import json
import requests
import logging
import numpy as np
from scipy.interpolate import griddata

logger = logging.getLogger("hazardmap.landslide")

# NOTE: This module shares the city baseline with heatwave for coordinate reference.
# If a separate landslide baseline is needed, update this path.
BASELINE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "heatwave_baseline.json")


def fetch_live_precipitation(cities):
    """Fetches a 7-day precipitation forecast (3 days past, 4 days future) for a list of city coordinates."""
    lats = ",".join([str(c["lat"]) for c in cities])
    lons = ",".join([str(c["lon"]) for c in cities])
    # Fetch 7 days of precipitation (past 3, today, future 3)
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lats}&longitude={lons}&daily=precipitation_sum&timezone=Asia/Kolkata&past_days=3&forecast_days=4"
    
    r = requests.get(url, timeout=20)
    if r.status_code != 200:
        raise Exception("Failed to fetch live precipitation forecast from Open-Meteo")
    data = r.json()
    if not isinstance(data, list):
        data = [data]
    return data


def get_interpolated_precipitation(lons: np.ndarray, lats: np.ndarray, target_date_offset: int = 0) -> np.ndarray:
    """
    Returns an array of rainfall intensity in mm/day interpolated across the given grid lons/lats.
    target_date_offset: -3 to +3 (0 is today).
    """
    if not os.path.exists(BASELINE_PATH):
        logger.warning("Baseline cities missing. Returning zero precipitation.")
        return np.zeros_like(lons)
        
    with open(BASELINE_PATH) as f:
        baseline_cities = json.load(f)
        
    forecast_data = fetch_live_precipitation(baseline_cities)
    
    base_coords = []
    base_precip = []
    
    # The array has 7 days: [-3, -2, -1, 0, 1, 2, 3]
    # Index 0 corresponds to -3. Index 3 is today (0).
    day_index = target_date_offset + 3
    if day_index < 0: day_index = 0
    if day_index > 6: day_index = 6
    
    for i, c in enumerate(baseline_cities):
        city_forecast = forecast_data[i]
        daily_precip = city_forecast.get("daily", {}).get("precipitation_sum", [])
        
        if daily_precip and len(daily_precip) > day_index:
            val = daily_precip[day_index]
            precip = val if val is not None else 0.0
        else:
            precip = 0.0
            
        base_coords.append([c["lon"], c["lat"]])
        base_precip.append(precip)
        
    base_coords = np.array(base_coords)
    base_precip = np.array(base_precip)
    
    # Interpolate using Inverse Distance Weighting (Linear)
    interpolated_intensity = griddata(base_coords, base_precip, (lons, lats), method='linear')
    
    # Handle NaN values (extrapolation outside the convex hull of cities)
    if np.isnan(interpolated_intensity).any():
        interpolated_near = griddata(base_coords, base_precip, (lons, lats), method='nearest')
        interpolated_intensity[np.isnan(interpolated_intensity)] = interpolated_near[np.isnan(interpolated_intensity)]
        
    return interpolated_intensity
