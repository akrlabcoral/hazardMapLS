import os
import numpy as np
import rasterio

RASTER_DIR = "data/rasters"

class LandslideRasterEngine:
    """
    Vectorized batch sampling of Slope, Elevation, and Soil Moisture rasters.
    """
    
    def __init__(self):
        self.slope_path = os.path.join(RASTER_DIR, "slope.tif")
        self.elev_path = os.path.join(RASTER_DIR, "elevation.tif")
        self.soil_path = os.path.join(RASTER_DIR, "soil_moisture.tif")
        
        # We don't keep them permanently open to avoid locking issues,
        # but for performance in a prod env we would cache the handles.
        
    def _sample_raster(self, raster_path: str, lons: np.ndarray, lats: np.ndarray, nodata_val: float = 0.0) -> np.ndarray:
        if not os.path.exists(raster_path):
            print(f"[LandslideRasterEngine] WARNING: Raster {raster_path} missing. Returning nodata.")
            return np.full(len(lons), nodata_val, dtype=np.float32)
            
        coords = [(float(lons[i]), float(lats[i])) for i in range(len(lons))]
        result = np.full(len(lons), nodata_val, dtype=np.float32)
        
        try:
            with rasterio.open(raster_path) as src:
                sampled = list(src.sample(coords))
                for j, val in enumerate(sampled):
                    raw = val[0]
                    # ignore extreme negative nodata values
                    if raw > -9998.0:
                        result[j] = np.float32(raw)
        except Exception as e:
            print(f"[LandslideRasterEngine] ERROR sampling {raster_path}: {e}")
            
        return result

    def get_features(self, lons: np.ndarray, lats: np.ndarray):
        """
        Returns a dictionary of arrays for slope, elevation, and soil_moisture.
        """
        return {
            "slope": self._sample_raster(self.slope_path, lons, lats, nodata_val=0.0),
            "elevation": self._sample_raster(self.elev_path, lons, lats, nodata_val=0.0),
            "soil_moisture": self._sample_raster(self.soil_path, lons, lats, nodata_val=0.1) # Default soil moisture
        }
