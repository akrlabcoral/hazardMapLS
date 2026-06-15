import os
import numpy as np
import rasterio

RASTER_DIR = "data/rasters"

class LandslideRasterEngine:
    """
    Vectorized batch sampling of Slope, Elevation, and Soil Moisture rasters.
    """
    _dataset_cache = {}
    
    def __init__(self):
        self.slope_path = os.path.join(RASTER_DIR, "repaired_slope.tif")
        self.elev_path = os.path.join(RASTER_DIR, "elevation.tif")
        self.soil_path = os.path.join(RASTER_DIR, "soil_moisture.tif")
        
    @classmethod
    def _open_dataset(cls, raster_path: str):
        if raster_path not in cls._dataset_cache:
            cls._dataset_cache[raster_path] = rasterio.open(raster_path)
        return cls._dataset_cache[raster_path]
        
    def _sample_raster(self, raster_path: str, lons: np.ndarray, lats: np.ndarray, nodata_val: float = 0.0) -> np.ndarray:
        if not os.path.exists(raster_path):
            print(f"[LandslideRasterEngine] WARNING: Raster {raster_path} missing. Returning nodata.")
            return np.full(len(lons), nodata_val, dtype=np.float32)
            
        coords = [(float(lons[i]), float(lats[i])) for i in range(len(lons))]
        result = np.full(len(lons), nodata_val, dtype=np.float32)
        
        try:
            src = self._open_dataset(raster_path)
            sampled = list(src.sample(coords))
            for j, val in enumerate(sampled):
                raw = val[0]
                # ignore extreme negative nodata values
                if raw > -9998.0:
                    result[j] = np.float32(raw)
        except Exception as e:
            print(f"[LandslideRasterEngine] ERROR sampling {raster_path}: {e}")
            
        return result

    def get_features(self, features: list, lons: np.ndarray, lats: np.ndarray, include_elevation: bool = True):
        """
        Returns a dictionary of arrays for slope, elevation, and soil_moisture.
        If the geojson features already contain cached values, reads them instantly to bypass slow raster I/O.
        """
        # Check if first feature has cached properties
        first_props = features[0].get("properties", {}) if features else {}
        if "slope" in first_props and "soil_moisture" in first_props:
            data = {
                "slope": np.array([f["properties"].get("slope", 0.0) for f in features], dtype=np.float32),
                "soil_moisture": np.array([f["properties"].get("soil_moisture", 0.1) for f in features], dtype=np.float32)
            }
            if include_elevation:
                if "elevation" in first_props:
                    data["elevation"] = np.array([f["properties"].get("elevation", 0.0) for f in features], dtype=np.float32)
                else:
                    data["elevation"] = self._sample_raster(self.elev_path, lons, lats, nodata_val=0.0)
            return data

        # Fallback to slow sampling
        data = {
            "slope": self._sample_raster(self.slope_path, lons, lats, nodata_val=0.0),
            "soil_moisture": self._sample_raster(self.soil_path, lons, lats, nodata_val=0.1) # Default soil moisture
        }
        if include_elevation:
            data["elevation"] = self._sample_raster(self.elev_path, lons, lats, nodata_val=0.0)
        return data
