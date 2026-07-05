"""
app/heatwave/heatwave_statistics.py

Aggregates the simulation results into district and state statistics dashboards.
"""
from app.heatwave.heatwave_classification import classify_heatwave

_UNKNOWN = {"Unknown", "Offshore/Unknown"}

def generate_statistics(grid_features: list) -> tuple[list[dict], dict[str, dict]]:
    district_scores = {}
    state_scores = {}

    for feature in grid_features:
        props = feature["properties"]
        district_name = props.get("district", "Unknown")
        state_name = props.get("state", "Unknown")
        
        wbgt = props.get("wbgt", 0.0)
        status = props.get("status", "Normal")
        
        # Rough population proxy: assume each grid cell has ~15k people
        pop_in_cell = 15000
        is_critical = status in ["Severe Heatwave", "Extreme Heatwave"]
        is_heatwave = status in ["Heatwave", "Severe Heatwave", "Extreme Heatwave"]
        
        if district_name not in _UNKNOWN:
            d = district_scores.setdefault(district_name, {"max_wbgt": -999.0, "pop_at_risk": 0, "status": "Normal"})
            if wbgt > d["max_wbgt"]: 
                d["max_wbgt"] = wbgt
                # Update status if this cell's status is worse (rough proxy by checking if it's heatwave)
                if is_heatwave:
                    d["status"] = status
            if is_critical: d["pop_at_risk"] += pop_in_cell

        if state_name not in _UNKNOWN:
            s = state_scores.setdefault(state_name, {"max_wbgt": -999.0, "pop_at_risk": 0, "total_cells": 0, "heatwave_cells": 0, "status": "Normal"})
            s["total_cells"] += 1
            if wbgt > s["max_wbgt"]: 
                s["max_wbgt"] = wbgt
                if is_heatwave:
                    s["status"] = status
            if is_critical: s["pop_at_risk"] += pop_in_cell
            if is_heatwave: s["heatwave_cells"] += 1

    district_summary = []
    for k, v in district_scores.items():
        if v["max_wbgt"] == -999.0: continue
        district_summary.append({
            "district": k,
            "max_wbgt": v["max_wbgt"],
            "pop_at_risk": v["pop_at_risk"],
            "status": v["status"],
            "lat": 20.0, # Dummy lat/lon since frontend/DB needs it
            "lon": 80.0
        })

    state_summary = {}
    for k, v in state_scores.items():
        if v["max_wbgt"] == -999.0: continue
        
        # Calculate IMD Spatial Coverage Percentage
        percent_affected = (v["heatwave_cells"] / v["total_cells"]) * 100 if v["total_cells"] > 0 else 0
        
        if percent_affected > 75:
            coverage = "Widespread"
        elif percent_affected > 50:
            coverage = "Fairly Widespread"
        elif percent_affected >= 25:
            coverage = "Scattered"
        elif percent_affected > 0:
            coverage = "Isolated"
        else:
            coverage = "None"
            
        status_str = "Extreme Heatwave" if v["max_wbgt"] >= 35.0 else ("Severe Heatwave" if v["max_wbgt"] >= 32.0 else "Normal")
        state_summary[k] = {
            "state": k,
            "max_wbgt": v["max_wbgt"],
            "pop_at_risk": v["pop_at_risk"],
            "status": status_str,
            "spatial_coverage": coverage,
            "percent_affected": round(percent_affected, 1)
        }

    return district_summary, state_summary
