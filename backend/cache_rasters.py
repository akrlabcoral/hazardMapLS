import json
import os
import numpy as np
from app.landslide.raster_engine import LandslideRasterEngine

def main():
    grid_path = "data/grids/nationwide_20km.geojson"
    print(f"Loading grid from {grid_path}...")
    
    with open(grid_path, "r") as f:
        grid = json.load(f)
        
    features = grid.get("features", [])
    if not features:
        print("No features found.")
        return
        
    lons = np.array([f["properties"]["centroid_lon"] for f in features], dtype=np.float64)
    lats = np.array([f["properties"]["centroid_lat"] for f in features], dtype=np.float64)
    
    print(f"Sampling rasters for {len(lons)} points. This may take ~60 seconds...")
    engine = LandslideRasterEngine()
    raster_data = engine.get_features(lons, lats, include_elevation=True)
    
    slope_arr = raster_data["slope"]
    soil_arr = raster_data["soil_moisture"]
    elev_arr = raster_data["elevation"]
    
    print("Injecting raster values into geojson properties...")
    for i, feat in enumerate(features):
        feat["properties"]["slope"] = float(slope_arr[i])
        feat["properties"]["soil_moisture"] = float(soil_arr[i])
        feat["properties"]["elevation"] = float(elev_arr[i])
        
    print(f"Saving updated grid back to {grid_path}...")
    with open(grid_path, "w") as f:
        json.dump(grid, f)
        
    print("Done! The 20km grid is now fully self-contained.")

if __name__ == "__main__":
    main()
