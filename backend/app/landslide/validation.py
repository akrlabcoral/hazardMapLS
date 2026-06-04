import os
import json
import numpy as np
from scipy.spatial import KDTree

VALIDATION_FILE = "data/landslides/india_landslides_NASA_GSI.geojson"

class LandslideValidator:
    def __init__(self, grid_features):
        self.features = grid_features
        self.kdtree = None
        self.historical_points = []
        self._load_data()
        
    def _load_data(self):
        if not os.path.exists(VALIDATION_FILE):
            print(f"[Validator] Warning: Validation file {VALIDATION_FILE} not found.")
            return
            
        try:
            with open(VALIDATION_FILE, 'r') as f:
                data = json.load(f)
                
            for feat in data.get("features", []):
                geom = feat.get("geometry", {})
                if geom.get("type") == "Point":
                    lon, lat = geom["coordinates"]
                    self.historical_points.append((lon, lat))
                    
            # Build KDTree for grid centroids
            centroids = [
                (f["properties"]["centroid_lon"], f["properties"]["centroid_lat"])
                for f in self.features
            ]
            self.kdtree = KDTree(centroids)
            
        except Exception as e:
            print(f"[Validator] Error loading historical data: {e}")

    def validate(self, risk_arr: np.ndarray) -> dict:
        """
        Calculates how many historical landslides fall within High/Very High risk zones.
        """
        if not self.kdtree or len(self.historical_points) == 0:
            return {"error": "Validation data missing or failed to load."}
            
        total_points = len(self.historical_points)
        high_risk_count = 0
        very_high_risk_count = 0
        
        # Query KDTree for nearest grid cell for all points at once
        _, indices = self.kdtree.query(self.historical_points)
        
        for idx in indices:
            risk = risk_arr[idx]
            if risk >= 0.8:
                very_high_risk_count += 1
            elif risk >= 0.6:
                high_risk_count += 1
                
        return {
            "total_historical_events": total_points,
            "events_in_high_risk": high_risk_count,
            "events_in_very_high_risk": very_high_risk_count,
            "accuracy_percentage": round((high_risk_count + very_high_risk_count) / total_points * 100, 2) if total_points > 0 else 0
        }
