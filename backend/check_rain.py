from app.landslide.live_weather import fetch_live_precipitation
import json

cities = json.load(open('/app/data/heatwave_baseline.json'))
data = fetch_live_precipitation(cities)

print("=== CITIES WITH RAIN TODAY ===")
for c, d in zip(cities, data):
    precip = d.get('daily', {}).get('precipitation_sum', [])
    today = precip[3] if len(precip) > 3 else 0
    if today and today > 0:
        print(f"  {c['name']} ({c['lat']}, {c['lon']}): {today} mm")

print("\n=== CITIES WITH ZERO RAIN TODAY ===")
zero_count = 0
for c, d in zip(cities, data):
    precip = d.get('daily', {}).get('precipitation_sum', [])
    today = precip[3] if len(precip) > 3 else 0
    if not today or today == 0:
        zero_count += 1
        print(f"  {c['name']} ({c['lat']}, {c['lon']}): 0 mm")

print(f"\nTotal: {len(cities)} cities, {len(cities) - zero_count} with rain, {zero_count} dry")
