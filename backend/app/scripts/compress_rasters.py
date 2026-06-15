import rasterio
import os

RASTER_DIR = "/app/data/rasters"

def compress_raster(filename):
    input_path = os.path.join(RASTER_DIR, filename)
    output_path = os.path.join(RASTER_DIR, f"compressed_{filename}")
    
    print(f"Compressing {filename}...")
    
    with rasterio.open(input_path) as src:
        profile = src.profile
        predictor = 3 if profile['dtype'] in ['float32', 'float64'] else 2
        profile.update(
            compress='lzw',
            predictor=predictor,
            tiled=True,
            blockxsize=256,
            blockysize=256
        )
        
        with rasterio.open(output_path, 'w', **profile) as dst:
            dst.write(src.read())
            
    # Replace original
    os.remove(input_path)
    os.rename(output_path, input_path)
    print(f"Finished compressing {filename}!")

if __name__ == "__main__":
    compress_raster("elevation.tif")
    print("Elevation raster compressed successfully.")
    print("All rasters compressed successfully.")
