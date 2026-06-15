import os
import json
import csv
import numpy as np
from scipy.spatial import KDTree

VALIDATION_FILE_GEOJSON = os.path.join(os.path.dirname(__file__), "..", "..", "data", "landslides", "india_landslides_NASA_GSI.geojson")
VALIDATION_FILE_CSV = os.path.join(os.path.dirname(__file__), "..", "..", "data", "landslides", "india_landslides_NASA_GSI.csv")

class LandslideValidator:
    def __init__(self, grid_features):
        self.features = grid_features
        self.kdtree = None
        self.historical_points = []
        self._load_data()
        
    def _load_data(self):
        # 1. Load GeoJSON
        if os.path.exists(VALIDATION_FILE_GEOJSON):
            try:
                with open(VALIDATION_FILE_GEOJSON, 'r') as f:
                    data = json.load(f)
                for feat in data.get("features", []):
                    geom = feat.get("geometry", {})
                    if geom.get("type") == "Point":
                        lon, lat = geom["coordinates"]
                        self.historical_points.append((float(lon), float(lat)))
            except Exception as e:
                print(f"[Validator] Error loading GeoJSON catalog: {e}")
                
        # 2. Load CSV
        if os.path.exists(VALIDATION_FILE_CSV):
            try:
                with open(VALIDATION_FILE_CSV, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        try:
                            lat = float(row["lat"])
                            lon = float(row["lon"])
                            self.historical_points.append((lon, lat))
                        except (ValueError, KeyError):
                            continue
            except Exception as e:
                print(f"[Validator] Error loading CSV catalog: {e}")
                
        if len(self.historical_points) == 0:
            print("[Validator] Warning: No historical points loaded from either catalog.")
            return

        # Build KDTree for grid centroids
        centroids = [
            (f["properties"]["centroid_lon"], f["properties"]["centroid_lat"])
            for f in self.features
        ]
        self.kdtree = KDTree(centroids)

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

    def get_geojson(self) -> dict:
        """
        Returns a GeoJSON FeatureCollection of all historical validation points
        so the frontend can render them as a MapLibre circle layer.
        """
        features = []
        for lon, lat in self.historical_points:
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [float(lon), float(lat)]},
                "properties": {}
            })
        return {"type": "FeatureCollection", "features": features}

    def historical_density(self, radius_degrees: float = 1.0) -> np.ndarray:
        """
        Return a normalized 0..1 score for each grid cell based on nearby
        historical landslide events. The radius is approximate degrees; 1.0 is
        roughly 100 km and gives a useful regional susceptibility signal.
        """
        if len(self.historical_points) == 0:
            return np.zeros(len(self.features), dtype=np.float32)

        centroids = [
            (f["properties"]["centroid_lon"], f["properties"]["centroid_lat"])
            for f in self.features
        ]
        hist_tree = KDTree(self.historical_points)
        nearby_counts = np.array(
            [len(items) for items in hist_tree.query_ball_point(centroids, r=radius_degrees)],
            dtype=np.float32,
        )
        nearest_dist, _ = hist_tree.query(centroids)
        proximity = np.exp(-np.square(nearest_dist / max(radius_degrees, 0.001))).astype(np.float32)
        raw_density = nearby_counts + proximity
        max_density = float(np.nanmax(raw_density)) if raw_density.size else 0.0
        if max_density <= 0:
            return np.zeros(len(self.features), dtype=np.float32)
        return np.clip(raw_density / max_density, 0.0, 1.0).astype(np.float32)
