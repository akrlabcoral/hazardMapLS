import pandas as pd
import json
import sys
import os

def process_csv(csv_path: str):
    print(f"Loading NASA Global Landslide Catalog from: {csv_path}")
    
    if not os.path.exists(csv_path):
        print(f"Error: File not found at {csv_path}")
        print("Please ensure you have downloaded the CSV and placed it in the correct location.")
        sys.exit(1)
        
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        sys.exit(1)
        
    print(f"Loaded {len(df)} global landslide records.")

    # Filter for India Bounding Box (Lat 6 to 38, Lon 68 to 98)
    if 'latitude' not in df.columns or 'longitude' not in df.columns:
        print("Error: The CSV does not contain 'latitude' and 'longitude' columns.")
        sys.exit(1)

    india_df = df[
        (df['latitude'] >= 6.0) & (df['latitude'] <= 38.0) &
        (df['longitude'] >= 68.0) & (df['longitude'] <= 98.0)
    ]

    # If the dataset has a country name column, filter strictly for India
    if 'country_name' in df.columns:
        india_df = india_df[india_df['country_name'].str.contains('India', na=False, case=False)]
    elif 'countrycode' in df.columns:
        india_df = india_df[india_df['countrycode'] == 'IN']

    print(f"Filtered down to {len(india_df)} records located in India.")

    if len(india_df) == 0:
        print("Warning: No records found for India! Please check your CSV data.")
        sys.exit(0)

    features = []
    for _, row in india_df.iterrows():
        lat = row['latitude']
        lon = row['longitude']
        
        if pd.isna(lat) or pd.isna(lon):
            continue
            
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(lon), float(lat)]
            },
            "properties": {
                "date": str(row.get('event_date', row.get('date', 'Unknown'))),
                "location": str(row.get('location_description', row.get('location', 'Unknown'))),
                "state": str(row.get('admin_division_name', row.get('state', 'Unknown'))),
                "deaths": int(row['fatalities']) if 'fatalities' in df.columns and not pd.isna(row['fatalities']) else 0,
                "trigger": str(row.get('landslide_trigger', 'Unknown')),
                "type": str(row.get('landslide_category', 'Landslide')),
                "source": "NASA GLC",
                "severity": str(row.get('landslide_size', 'Unknown'))
            }
        }
        features.append(feature)

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "landslides", "india_landslides_NASA_GSI.geojson")
    
    with open(out_path, 'w') as f:
        json.dump(geojson, f, indent=2)

    print(f"Successfully saved {len(features)} formatted features to:")
    print(out_path)
    print("You can now refresh your HazardMap dashboard. The validation module will use this new dataset!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_nasa_glc.py <path_to_downloaded_csv>")
        sys.exit(1)
        
    csv_file_path = sys.argv[1]
    process_csv(csv_file_path)
