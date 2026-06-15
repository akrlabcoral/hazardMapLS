"""
app/heatwave/heatwave_classification.py

Handles categorical classification of heatwave risk based on IMD temperature thresholds.
"""

def classify_heatwave(wbgt: float, anomaly: float, max_temp: float, elevation: float) -> str:
    """
    Classify heatwave risk based on exact IMD rules and WBGT lethality.
    
    IMD Criteria for Plains (Elevation < 1000m):
    - Base max_temp >= 40°C
    - Normal: Anomaly < 4.5°C
    - Heatwave: Anomaly 4.5°C to 6.4°C (or max_temp >= 45°C)
    - Severe Heatwave: Anomaly > 6.4°C (or max_temp >= 47°C)
    
    IMD Criteria for Hilly Regions (Elevation >= 1000m):
    - Base max_temp >= 30°C
    - Normal: Anomaly < 4.5°C
    - Heatwave: Anomaly 4.5°C to 6.4°C
    - Severe Heatwave: Anomaly > 6.4°C
    
    WBGT Lethality override:
    - Extreme Heatwave: WBGT > 35°C (human survivability limit)
    """
    
    # 1. Global Lethality Override (WBGT physics)
    if wbgt >= 35.0:
        return "Extreme Heatwave"
        
    is_hilly = elevation >= 1000.0
    
    if is_hilly:
        if max_temp >= 30.0:
            if anomaly > 6.4:
                return "Severe Heatwave"
            elif anomaly >= 4.5:
                return "Heatwave"
    else:
        if max_temp >= 40.0:
            if anomaly > 6.4 or max_temp >= 47.0:
                return "Severe Heatwave"
            elif anomaly >= 4.5 or max_temp >= 45.0:
                return "Heatwave"

    # Fallback to general warming if below thresholds but WBGT or Temp is still uncomfortable
    if wbgt >= 30.0 or max_temp >= 40.0:
        return "Warm"
        
    return "Normal"

def get_risk_score(classification: str) -> float:
    """
    Maps the string classification back to a normalized float [0,1]
    for map rendering gradients if needed.
    """
    mapping = {
        "Normal": 0.1,
        "Warm": 0.4,
        "Heatwave": 0.6,
        "Severe Heatwave": 0.8,
        "Extreme Heatwave": 1.0
    }
    return mapping.get(classification, 0.0)
