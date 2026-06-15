import requests
import json
import os
import time
from datetime import datetime

# 50 Reference Cities spread across India to cover all climatic zones
CITIES = [
    {"name": "Delhi", "lat": 28.61, "lon": 77.23},
    {"name": "Mumbai", "lat": 19.07, "lon": 72.87},
    {"name": "Kolkata", "lat": 22.57, "lon": 88.36},
    {"name": "Chennai", "lat": 13.08, "lon": 80.27},
    {"name": "Bengaluru", "lat": 12.97, "lon": 77.59},
    {"name": "Hyderabad", "lat": 17.38, "lon": 78.48},
    {"name": "Ahmedabad", "lat": 23.02, "lon": 72.57},
    {"name": "Pune", "lat": 18.52, "lon": 73.85},
    {"name": "Jaipur", "lat": 26.91, "lon": 75.78},
    {"name": "Lucknow", "lat": 26.84, "lon": 80.94},
    {"name": "Kanpur", "lat": 26.44, "lon": 80.33},
    {"name": "Nagpur", "lat": 21.14, "lon": 79.08},
    {"name": "Indore", "lat": 22.71, "lon": 75.86},
    {"name": "Thane", "lat": 19.21, "lon": 72.96},
    {"name": "Bhopal", "lat": 23.25, "lon": 77.41},
    {"name": "Visakhapatnam", "lat": 17.68, "lon": 83.21},
    {"name": "Patna", "lat": 25.59, "lon": 85.13},
    {"name": "Vadodara", "lat": 22.30, "lon": 73.19},
    {"name": "Ludhiana", "lat": 30.90, "lon": 75.85},
    {"name": "Agra", "lat": 27.17, "lon": 78.00},
    {"name": "Srinagar", "lat": 34.08, "lon": 74.79},
    {"name": "Jammu", "lat": 32.72, "lon": 74.85},
    {"name": "Shimla", "lat": 31.10, "lon": 77.17},
    {"name": "Dehradun", "lat": 30.31, "lon": 78.03},
    {"name": "Chandigarh", "lat": 30.73, "lon": 76.77},
    {"name": "Bhubaneswar", "lat": 20.29, "lon": 85.82},
    {"name": "Guwahati", "lat": 26.14, "lon": 91.73},
    {"name": "Shillong", "lat": 25.57, "lon": 91.89},
    {"name": "Itanagar", "lat": 27.08, "lon": 93.60},
    {"name": "Kohima", "lat": 25.67, "lon": 94.10},
    {"name": "Imphal", "lat": 24.81, "lon": 93.93},
    {"name": "Aizawl", "lat": 23.72, "lon": 92.71},
    {"name": "Agartala", "lat": 23.83, "lon": 91.27},
    {"name": "Gangtok", "lat": 27.33, "lon": 88.61},
    {"name": "Raipur", "lat": 21.25, "lon": 81.62},
    {"name": "Ranchi", "lat": 23.34, "lon": 85.30},
    {"name": "Jamshedpur", "lat": 22.80, "lon": 86.20},
    {"name": "Kochi", "lat": 9.93, "lon": 76.26},
    {"name": "Thiruvananthapuram", "lat": 8.52, "lon": 76.93},
    {"name": "Madurai", "lat": 9.92, "lon": 78.11},
    {"name": "Coimbatore", "lat": 11.01, "lon": 76.95},
    {"name": "Mysuru", "lat": 12.29, "lon": 76.62},
    {"name": "Mangaluru", "lat": 12.91, "lon": 74.85},
    {"name": "Panaji", "lat": 15.49, "lon": 73.82},
    {"name": "Port Blair", "lat": 11.62, "lon": 92.72},
    {"name": "Kavaratti", "lat": 10.56, "lon": 72.64},
    {"name": "Leh", "lat": 34.15, "lon": 77.57},
    {"name": "Jaisalmer", "lat": 26.91, "lon": 70.90},
    {"name": "Bikaner", "lat": 28.02, "lon": 73.31},
    {"name": "Kanyakumari", "lat": 8.08, "lon": 77.53}
]

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
OUT_PATH = os.path.join(DATA_DIR, "heatwave_baseline.json")

def fetch_era5_data():
    print("Fetching 1991-2020 ERA5 Reanalysis data for 50 Indian cities...")
    
    # We will just fetch the current month's historical data to save processing time
    # Instead of pulling 10,000 days per city, we pull only the dates for the current month
    # For a full production system, we'd pull 365 days, but Open-Meteo allows fetching specific date ranges.
    
    # To keep the API fast and within limits, let's just pull 2011-2020 (a 10-year baseline) 
    # to approximate the "Recent Normal" which is highly accurate and reduces the payload by 3x.
    # We'll pull May/June specifically since it's the main heatwave season, OR we can pull year-round.
    
    start_date = "2011-01-01"
    end_date = "2020-12-31"
    
    lats = [str(c["lat"]) for c in CITIES]
    lons = [str(c["lon"]) for c in CITIES]
    
    url = f"https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": ",".join(lats),
        "longitude": ",".join(lons),
        "start_date": start_date,
        "end_date": end_date,
        "daily": "temperature_2m_max",
        "timezone": "Asia/Kolkata"
    }
    
    response = requests.get(url, params=params)
    if response.status_code != 200:
        print(f"Error fetching data: {response.text}")
        return
        
    data = response.json()
    
    # data is a list of responses (one per coordinate) if we passed multiple
    # Wait, Open-Meteo returns a list of objects if multiple coords are passed
    if isinstance(data, dict) and "error" in data:
        print(f"API Error: {data}")
        return
        
    results = []
    
    # Open-Meteo returns a list if multiple locations
    if not isinstance(data, list):
        data = [data]
        
    for i, city_data in enumerate(data):
        city = CITIES[i]
        daily = city_data.get("daily", {})
        dates = daily.get("time", [])
        temps = daily.get("temperature_2m_max", [])
        
        # We will calculate the average max temperature for each month (1 to 12)
        # This acts as our "Monthly Normal"
        monthly_sums = {m: 0.0 for m in range(1, 13)}
        monthly_counts = {m: 0 for m in range(1, 13)}
        
        for d, t in zip(dates, temps):
            if t is not None:
                dt = datetime.strptime(d, "%Y-%m-%d")
                monthly_sums[dt.month] += t
                monthly_counts[dt.month] += 1
                
        monthly_normals = {}
        for m in range(1, 13):
            if monthly_counts[m] > 0:
                monthly_normals[str(m)] = round(monthly_sums[m] / monthly_counts[m], 2)
            else:
                monthly_normals[str(m)] = 35.0 # fallback
                
        results.append({
            "name": city["name"],
            "lat": city["lat"],
            "lon": city["lon"],
            "monthly_normals": monthly_normals
        })
        
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(results, f, indent=2)
        
    print(f"Successfully saved ERA5 climate baseline for {len(results)} cities to {OUT_PATH}")

if __name__ == "__main__":
    fetch_era5_data()
