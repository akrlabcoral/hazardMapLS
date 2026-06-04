import numpy as np

def normalize(arr: np.ndarray, absolute_max: float = None) -> np.ndarray:
    """Min-max normalization. If absolute_max is provided, normalizes against it."""
    if absolute_max is not None:
        return np.clip(arr / absolute_max, 0.0, 1.0)
        
    arr_min = np.nanmin(arr)
    arr_max = np.nanmax(arr)
    if arr_max == arr_min:
        if arr_max > 0:
            return np.ones_like(arr)
        return np.zeros_like(arr)
    return (arr - arr_min) / (arr_max - arr_min)

def classify_risk(risk_arr: np.ndarray) -> np.ndarray:
    """
    Classifies continuous risk (0.0 - 1.0) into discrete categories:
    0.0 - 0.2 = Very Low (1)
    0.2 - 0.4 = Low (2)
    0.4 - 0.6 = Moderate (3)
    0.6 - 0.8 = High (4)
    0.8 - 1.0 = Very High (5)
    """
    classes = np.zeros_like(risk_arr, dtype=np.uint8)
    classes[(risk_arr >= 0.0) & (risk_arr <= 0.2)] = 1
    classes[(risk_arr > 0.2) & (risk_arr <= 0.4)] = 2
    classes[(risk_arr > 0.4) & (risk_arr <= 0.6)] = 3
    classes[(risk_arr > 0.6) & (risk_arr <= 0.8)] = 4
    classes[(risk_arr > 0.8) & (risk_arr <= 1.0)] = 5
    return classes

def rainfall_induced_risk(slope: np.ndarray, rainfall: np.ndarray, soil: np.ndarray, hist_density: np.ndarray) -> np.ndarray:
    """
    Type 1: Rainfall-Induced Landslide Risk
    risk = 0.40 * slope + 0.30 * rainfall + 0.20 * soil + 0.10 * historical_density
    """
    norm_slope = normalize(slope)
    norm_rainfall = normalize(rainfall, absolute_max=500.0) # Assume 500mm total rain is 1.0 risk
    norm_soil = normalize(soil)
    norm_hist = normalize(hist_density)
    
    risk = (0.40 * norm_slope) + (0.30 * norm_rainfall) + (0.20 * norm_soil) + (0.10 * norm_hist)
    return np.clip(risk, 0.0, 1.0) # Do not re-normalize, let risk rise!

def earthquake_induced_risk(slope: np.ndarray, pga: np.ndarray, soil: np.ndarray) -> np.ndarray:
    norm_slope = normalize(slope)
    norm_soil = normalize(soil)
    
    # Susceptibility based on terrain
    susceptibility = (0.70 * norm_slope) + (0.30 * norm_soil)
    
    # A minimum PGA of ~0.05g is typically required to trigger landslides.
    # PGA is in 'g'. We create a trigger multiplier that is 0 below 0.05g.
    # We'll normalize pga but enforce the threshold.
    PGA_THRESHOLD = 0.02
    
    trigger = np.zeros_like(pga)
    # For PGA > threshold, scale trigger from 0.0 to 1.0
    valid_mask = pga > PGA_THRESHOLD
    if np.any(valid_mask):
        # Scale logarithmically or linearly. Linear is fine for visual gradient.
        # Max expected PGA is around 1.0g
        trigger[valid_mask] = np.clip((pga[valid_mask] - PGA_THRESHOLD) / (1.0 - PGA_THRESHOLD), 0.0, 1.0)
        
        # Boost the trigger so moderate shaking (e.g. 0.2g) has a strong effect
        trigger[valid_mask] = np.clip(trigger[valid_mask] * 3.0, 0.0, 1.0)
    
    # Calculate base risk
    risk = susceptibility * trigger
    
    # Add a direct impact from extremely violent shaking regardless of terrain
    norm_pga = np.clip(pga / 1.0, 0.0, 1.0)
    risk = risk + (0.30 * norm_pga)
    
    # Apply strict zeroing for areas under threshold to clear up map noise
    risk[pga < PGA_THRESHOLD] = 0.0
    
    return np.clip(risk, 0.0, 1.0)

def combined_induced_risk(slope: np.ndarray, rainfall: np.ndarray, pga: np.ndarray, soil: np.ndarray, elevation: np.ndarray) -> np.ndarray:
    """
    Type 3: Combined Trigger (Rainfall + Earthquake) Risk
    risk = 0.30 * slope + 0.25 * rainfall + 0.25 * pga + 0.10 * soil + 0.10 * elevation
    """
    norm_slope = normalize(slope)
    norm_rainfall = normalize(rainfall, absolute_max=500.0)
    norm_pga = normalize(pga, absolute_max=1.0)
    norm_soil = normalize(soil)
    norm_elevation = normalize(elevation)
    
    risk = (0.30 * norm_slope) + (0.25 * norm_rainfall) + (0.25 * norm_pga) + (0.10 * norm_soil) + (0.10 * norm_elevation)
    return np.clip(risk, 0.0, 1.0)
