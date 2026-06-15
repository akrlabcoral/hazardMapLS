import rasterio
from rasterio.windows import Window
import numpy as np
import os

RASTER_DIR = "/app/data/rasters"

def repair_raster(filename):
    input_path = os.path.join(RASTER_DIR, filename)
    output_path = os.path.join(RASTER_DIR, f"repaired_{filename}")
    
    print(f"Attempting to repair and compress {filename}...")
    
    try:
        with rasterio.open(input_path) as src:
            profile = src.profile
            profile.update(
                compress='lzw',
                predictor=3,
                tiled=True,
                blockxsize=256,
                blockysize=256
            )
            
            with rasterio.open(output_path, 'w', **profile) as dst:
                height = src.height
                width = src.width
                
                # Read block by block to isolate corruption
                for i in range(0, height, 256):
                    for j in range(0, width, 256):
                        win_width = min(256, width - j)
                        win_height = min(256, height - i)
                        window = Window(col_off=j, row_off=i, width=win_width, height=win_height)
                        
                        try:
                            # Try to read the block
                            data = src.read(window=window)
                        except Exception as e:
                            print(f"Corruption found at window {window}. Filling with NoData (0).")
                            # If corrupt, fill with nodata or 0
                            data = np.zeros((src.count, win_height, win_width), dtype=profile['dtype'])
                        
                        dst.write(data, window=window)
                        
        print(f"Successfully repaired {filename}!")
        # Swap files
        os.remove(input_path)
        os.rename(output_path, input_path)
    except Exception as e:
        print(f"Failed to open or repair file: {e}")

if __name__ == "__main__":
    repair_raster("slope.tif")
    # repair_raster("elevation.tif") # Only slope.tif crashed earlier
