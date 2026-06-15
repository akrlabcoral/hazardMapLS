import numpy as np

def calculate_wbgt_and_anomaly(live_temp: np.ndarray, live_humidity: np.ndarray, baseline_temp: np.ndarray, elevation: np.ndarray, duration_days: int, urban_mask: np.ndarray):
    """
    Advanced Mathematical Physics engine for Heatwave analysis.
    
    1. Base temperature is adjusted by the Environmental Lapse Rate (-6.5°C per 1000m).
    2. Urban Heat Island (UHI) penalty is applied (+3°C to +5°C in urban mask areas).
    3. Stull's empirical formula calculates Wet-Bulb Temperature (WBGT) from Temp and Humidity.
    4. Anomaly is calculated: (Adjusted Live Temp) - (Adjusted Baseline Temp).
    5. The 2-Day rule compounds heat stress if duration > 2 days.
    """
    
    # 1. Elevation Mitigation (applies to both live and baseline)
    lapse_rate = (elevation / 1000.0) * 6.5
    adj_live_temp = live_temp - lapse_rate
    adj_baseline_temp = baseline_temp - lapse_rate
    
    # 2. Urban Heat Island (UHI) penalty
    # Assume urban areas get +3.5C hotter during heatwaves
    uhi_penalty = urban_mask * 3.5
    adj_live_temp += uhi_penalty
    
    # 3. Wet-Bulb Globe Temperature (WBGT) via simplified Stull's Formula
    # T * arctan(0.151977 * sqrt(rh% + 8.313659)) + arctan(T + rh%) - arctan(rh% - 1.676331) + 0.00391838 * (rh%)^(3/2) * arctan(0.023101 * rh%) - 4.686035
    T = adj_live_temp
    RH = np.clip(live_humidity, 0.0, 100.0)
    
    term1 = T * np.arctan(0.151977 * np.sqrt(RH + 8.313659))
    term2 = np.arctan(T + RH)
    term3 = -np.arctan(RH - 1.676331)
    term4 = 0.00391838 * np.power(RH, 1.5) * np.arctan(0.023101 * RH)
    
    wbgt = term1 + term2 + term3 + term4 - 4.686035
    
    # 4. Calculate True Anomaly
    anomaly = adj_live_temp - adj_baseline_temp
    
    # 5. Compound Duration Penalty (The 2-Day Rule)
    # Heatwaves get more lethal if they persist (buildings absorb heat, human fatigue)
    # The IMD requires at least 2 days for an official heatwave
    if duration_days < 2:
        # Cap anomaly to prevent official Heatwave classification if it's just a 1-day spike
        anomaly = np.minimum(anomaly, 4.4)
    else:
        # Add a lethality penalty to WBGT for prolonged exposure
        duration_penalty = (duration_days - 2) * 0.4
        wbgt += duration_penalty
        
    return wbgt, anomaly, adj_live_temp

