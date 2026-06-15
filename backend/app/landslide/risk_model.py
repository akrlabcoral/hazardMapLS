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

def smooth_step(x: np.ndarray, edge0: float, edge1: float) -> np.ndarray:
    """Smooth Hermite interpolation between 0 and 1"""
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)

def rainfall_induced_risk(
    slope: np.ndarray, 
    intensity: np.ndarray, 
    duration: float, 
    soil: np.ndarray, 
    elevation: np.ndarray, 
    hist_density: np.ndarray,
    lats: np.ndarray,
    lons: np.ndarray
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Literature-Based Rainfall-Induced Landslide Risk Model
    """
    # 1. Identify NASA Historical Regions (User's Strategy)
    # We first identify all regions where landslides have historically occurred.
    is_historical = (hist_density > 0.01) if hist_density is not None else np.zeros_like(slope, dtype=bool)
    is_steep = slope >= 10.0
    valid_region = is_historical | is_steep

    # 2. Calculate AHP Susceptibility
    norm_slope = normalize(slope, absolute_max=30.0)
    norm_soil = normalize(soil, absolute_max=0.7)
    norm_hist = np.clip(hist_density, 0.0, 1.0) if hist_density is not None else np.zeros_like(norm_slope)
    norm_elevation = normalize(elevation, absolute_max=2500.0)
    
    susceptibility = (0.45 * norm_slope) + (0.25 * norm_soil) + (0.20 * norm_hist) + (0.10 * norm_elevation)
    
    # Apply NASA Mask: Guarantee historical regions have a base susceptibility, and erase non-valid regions
    susceptibility[is_historical] = np.maximum(susceptibility[is_historical], 0.35)
    susceptibility[~valid_region] = 0.0
    
    # 2. Regional Rainfall Trigger (Smooth Geographic Blending)
    safe_duration = max(0.1, duration)
    
    # Himalayas: Lat > 24 to Lat > 28, Elev > 300 to Elev > 1000
    himalaya_lat_wt = smooth_step(lats, 24.0, 28.0)
    himalaya_elev_wt = smooth_step(elevation, 300.0, 1000.0)
    himalaya_weight = himalaya_lat_wt * himalaya_elev_wt
    
    # Western Ghats / Kerala: Lat < 20 to Lat < 16, Elev > 100 to Elev > 500
    peninsular_lat_wt = smooth_step(lats, 20.0, 16.0)
    peninsular_elev_wt = smooth_step(elevation, 100.0, 500.0)
    peninsular_weight = peninsular_lat_wt * peninsular_elev_wt
    
    default_weight = np.clip(1.0 - (himalaya_weight + peninsular_weight), 0.0, 1.0)
    
    I_himalaya = 58.7 * (safe_duration ** -1.12)
    I_kerala = 0.9 * (safe_duration ** -0.16)
    I_default = 10.0 * (safe_duration ** -0.5)
    
    I_crit = (himalaya_weight * I_himalaya) + (peninsular_weight * I_kerala) + (default_weight * I_default)
    
    trigger = np.zeros_like(intensity)
    valid_mask = intensity >= I_crit
    if np.any(valid_mask):
        trigger[valid_mask] = np.clip((intensity[valid_mask] - I_crit[valid_mask]) / (I_crit[valid_mask] * 2.0), 0.0, 1.0)
        
    # 3. Final Risk Calculation
    # Hazard = Vulnerability * (1 + Trigger)
    risk = np.clip(susceptibility * (1.0 + trigger), 0.0, 1.0)
    
    return risk, susceptibility, trigger


def earthquake_induced_risk(
    slope: np.ndarray,
    pga: np.ndarray,
    soil: np.ndarray,
    elevation: np.ndarray,
    hist_density: np.ndarray | None = None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Seismic-Induced Landslide Risk Model
    Uses AHP Susceptibility and Newmark sliding block PGA thresholds.
    """
    # 1. Identify NASA Historical Regions
    is_historical = (hist_density > 0.01) if hist_density is not None else np.zeros_like(slope, dtype=bool)
    is_steep = slope >= 10.0
    valid_region = is_historical | is_steep

    # 2. Calculate AHP Susceptibility
    norm_slope = normalize(slope, absolute_max=30.0)
    norm_soil = normalize(soil, absolute_max=0.7)
    norm_hist = np.clip(hist_density, 0.0, 1.0) if hist_density is not None else np.zeros_like(norm_slope)
    norm_elevation = normalize(elevation, absolute_max=2500.0)
    
    susceptibility = (0.45 * norm_slope) + (0.25 * norm_soil) + (0.20 * norm_hist) + (0.10 * norm_elevation)
    
    # Apply NASA Mask
    susceptibility[is_historical] = np.maximum(susceptibility[is_historical], 0.35)
    susceptibility[~valid_region] = 0.0
    
    # 2. Estimate Critical Acceleration (Ac) in g
    # Susceptible slopes (s~1.0) have Ac ~ 0.05g (fails easily)
    # Safe areas (s~0.0) have Ac ~ 1.05g (rarely fails)
    Ac = 0.05 + 1.0 * (1.0 - susceptibility)
    
    # 3. Calculate Newmark Displacement (Dn) using Jibson (2007)
    Dn = np.zeros_like(pga)
    valid_mask = pga > Ac
    if np.any(valid_mask):
        ac_pga_ratio = Ac[valid_mask] / pga[valid_mask]
        log_dn = 0.215 + np.log10( np.power(1.0 - ac_pga_ratio, 2.34) * np.power(ac_pga_ratio, -1.43) )
        Dn[valid_mask] = np.power(10.0, log_dn)
        
    # 5. Calculate Probability of Failure (PoF)
    # Jibson (2000): P(f) = 0.335 * [1 - exp(-0.048 * Dn^1.565)]
    trigger = np.zeros_like(pga)
    if np.any(valid_mask):
        pof = 0.335 * (1.0 - np.exp(-0.048 * np.power(Dn[valid_mask], 1.565)))
        # Normalize to 0-1 for our frontend scale
        trigger[valid_mask] = np.clip(pof / 0.335, 0.0, 1.0)
    
    # 6. Final Risk
    risk = np.clip(susceptibility * trigger, 0.0, 1.0)
    
    return risk, susceptibility, trigger


def combined_induced_risk(
    slope: np.ndarray,
    intensity: np.ndarray,
    duration: float,
    pga: np.ndarray,
    soil: np.ndarray,
    elevation: np.ndarray,
    lats: np.ndarray,
    lons: np.ndarray,
    hist_density: np.ndarray | None = None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Combined Trigger (Rainfall + Earthquake) Risk Model
    Fuses regional empirical rainfall triggers with Newmark sliding block PGA thresholds.
    """
    # 1. Identify NASA Historical Regions
    is_historical = (hist_density > 0.01) if hist_density is not None else np.zeros_like(slope, dtype=bool)
    is_steep = slope >= 10.0
    valid_region = is_historical | is_steep

    # 2. Calculate AHP Susceptibility (Static Terrain Risk)
    norm_slope = normalize(slope, absolute_max=30.0)
    norm_soil = normalize(soil, absolute_max=0.7)
    norm_hist = np.clip(hist_density, 0.0, 1.0) if hist_density is not None else np.zeros_like(norm_slope)
    norm_elevation = normalize(elevation, absolute_max=2500.0)
    
    susceptibility = (0.45 * norm_slope) + (0.25 * norm_soil) + (0.20 * norm_hist) + (0.10 * norm_elevation)
    
    # Apply NASA Mask
    susceptibility[is_historical] = np.maximum(susceptibility[is_historical], 0.35)
    susceptibility[~valid_region] = 0.0
    
    # 2. Regional Rainfall Trigger
    safe_duration = max(0.1, duration)
    
    # Himalayas: Lat > 24 to Lat > 28, Elev > 300 to Elev > 1000
    himalaya_lat_wt = smooth_step(lats, 24.0, 28.0)
    himalaya_elev_wt = smooth_step(elevation, 300.0, 1000.0)
    himalaya_weight = himalaya_lat_wt * himalaya_elev_wt
    
    # Western Ghats / Kerala: Lat < 20 to Lat < 16, Elev > 100 to Elev > 500
    peninsular_lat_wt = smooth_step(lats, 20.0, 16.0)
    peninsular_elev_wt = smooth_step(elevation, 100.0, 500.0)
    peninsular_weight = peninsular_lat_wt * peninsular_elev_wt
    
    default_weight = np.clip(1.0 - (himalaya_weight + peninsular_weight), 0.0, 1.0)
    
    I_himalaya = 58.7 * (safe_duration ** -1.12)
    I_kerala = 0.9 * (safe_duration ** -0.16)
    I_default = 10.0 * (safe_duration ** -0.5)
    
    I_crit = (himalaya_weight * I_himalaya) + (peninsular_weight * I_kerala) + (default_weight * I_default)
    
    rain_trigger = np.zeros_like(intensity)
    rain_mask = intensity >= I_crit
    if np.any(rain_mask):
        rain_trigger[rain_mask] = np.clip((intensity[rain_mask] - I_crit[rain_mask]) / (I_crit[rain_mask] * 2.0), 0.0, 1.0)
        
    # 3. Dynamic Earthquake Trigger
    ay = np.maximum(0.01, (np.cos(np.radians(slope)) - np.sin(np.radians(slope)) * 0.5)) * 9.81
    seismic_trigger = np.zeros_like(pga)
    pga_valid_mask = pga >= ay
    
    if np.any(pga_valid_mask):
        dn = 10 ** (1.521 * np.log10(pga[pga_valid_mask]) - 1.993 * np.log10(ay[pga_valid_mask]) - 1.546)
        pof = 0.335 * (1 - np.exp(-0.048 * (dn ** 1.565)))
        seismic_trigger[pga_valid_mask] = np.clip(pof / 0.335, 0.0, 1.0)
        
    # 4. Synergistic Combination (Probabilistic Union)
    combined_trigger = 1.0 - (1.0 - rain_trigger) * (1.0 - seismic_trigger)
    combined_trigger = np.clip(combined_trigger, 0.0, 1.0)
    
    # 5. Final Risk
    # Hazard = Vulnerability * (1 + Trigger)
    fused_risk = np.clip(susceptibility * (1.0 + combined_trigger), 0.0, 1.0)
    
    return fused_risk, susceptibility, combined_trigger
