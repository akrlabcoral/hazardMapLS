import numpy as np

def normalize(arr: np.ndarray, absolute_max: float = None) -> np.ndarray:
    if absolute_max is not None:
        return np.clip(arr / absolute_max, 0.0, 1.0)
    arr_min = np.nanmin(arr)
    arr_max = np.nanmax(arr)
    if arr_max == arr_min:
        return np.zeros_like(arr) if arr_max == 0 else np.ones_like(arr)
    return (arr - arr_min) / (arr_max - arr_min)

def classify_risk(risk_arr: np.ndarray) -> np.ndarray:
    classes = np.zeros_like(risk_arr, dtype=np.uint8)
    classes[(risk_arr >= 0.0) & (risk_arr <= 0.2)] = 1
    classes[(risk_arr > 0.2) & (risk_arr <= 0.4)] = 2
    classes[(risk_arr > 0.4) & (risk_arr <= 0.6)] = 3
    classes[(risk_arr > 0.6) & (risk_arr <= 0.8)] = 4
    classes[(risk_arr > 0.8) & (risk_arr <= 1.0)] = 5
    return classes

def smooth_step(x: np.ndarray, edge0: float, edge1: float) -> np.ndarray:
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)

def gaussian_membership(x: np.ndarray, center: float, width: float) -> np.ndarray:
    """Fuzzy membership curve peaking at 'center'"""
    return np.exp(-0.5 * ((x - center) / width) ** 2)

def calculate_bifurcated_susceptibility(slope, soil, elevation, hist_density, lats):
    """
    Implements the scientific AHP bifurcation based on literature.
    """
    # 1. Scientific Topographic Normalizations
    # Himalaya: Peak slope 40 deg, Peak Elev 2500m
    himalaya_slope_norm = gaussian_membership(slope, center=40.0, width=15.0)
    himalaya_elev_norm = gaussian_membership(elevation, center=2500.0, width=800.0)
    
    # Peninsular: Peak slope 38 deg, Peak Elev 650m
    peninsular_slope_norm = gaussian_membership(slope, center=38.0, width=15.0)
    peninsular_elev_norm = gaussian_membership(elevation, center=650.0, width=300.0)
    
    # Soil Saturation Threshold (Kerala model: Saturation >= 0.7 is max)
    soil_norm = np.clip(soil / 0.7, 0.0, 1.0)
    soil_norm[soil >= 0.7] = 1.0
    
    hist_norm = np.clip(hist_density, 0.0, 1.0) if hist_density is not None else np.zeros_like(slope)
    
    # Calculate Regional AHP using Single-Level Hierarchy Renormalization (Wijnmalen, 2004)
    # Excludes Historical Density to prevent circular reasoning/overfitting.
    
    # Himalaya (Dwivedi): Original Sum = Slope(0.23) + Soil/Rain(0.06) + Elev(0.05) = 0.34
    # Normalized: Slope(0.676) + Soil(0.176) + Elev(0.147)
    himalaya_susc = (0.676 * himalaya_slope_norm) + (0.176 * soil_norm) + (0.147 * himalaya_elev_norm)
    
    # Peninsular (Irshad): Original Sum = Soil(0.47) + Slope(0.19) + Elev(0.05) = 0.71
    # Normalized: Soil(0.662) + Slope(0.268) + Elev(0.070)
    peninsular_susc = (0.268 * peninsular_slope_norm) + (0.662 * soil_norm) + (0.070 * peninsular_elev_norm)
    
    # Blend based on latitude
    himalaya_weight = smooth_step(lats, 24.0, 28.0)
    peninsular_weight = smooth_step(lats, 20.0, 16.0)
    default_weight = np.clip(1.0 - (himalaya_weight + peninsular_weight), 0.0, 1.0)
    
    # Default fallback susc
    default_susc = (0.45 * np.clip(slope/30, 0, 1)) + (0.25 * soil_norm) + (0.10 * np.clip(elevation/2500, 0, 1)) + (0.20 * hist_norm)
    
    final_susc = (himalaya_weight * himalaya_susc) + (peninsular_weight * peninsular_susc) + (default_weight * default_susc)
    
    return np.clip(final_susc, 0.0, 1.0)

def giri_matrix_fusion(susceptibility: np.ndarray, trigger: np.ndarray) -> np.ndarray:
    """
    Implements CDRI/GIRI Matrix Intersection Logic.
    Risk is non-linear geometric intersection `sqrt(S * T)`
    Baseline susceptibility remains so the map isn't blank.
    """
    baseline = susceptibility * 0.4
    intersection = np.sqrt(susceptibility * trigger)
    return np.clip(baseline + intersection, 0.0, 1.0)

def rainfall_induced_risk(
    slope: np.ndarray, intensity: np.ndarray, duration: float, 
    soil: np.ndarray, elevation: np.ndarray, hist_density: np.ndarray,
    lats: np.ndarray, lons: np.ndarray
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    
    susceptibility = calculate_bifurcated_susceptibility(slope, soil, elevation, hist_density, lats)
    
    is_historical = (hist_density > 0.01) if hist_density is not None else np.zeros_like(slope, dtype=bool)
    valid_region = is_historical | (slope >= 10.0)
    susceptibility[is_historical] = np.maximum(susceptibility[is_historical], 0.35)
    susceptibility[~valid_region] = 0.0
    
    safe_duration = max(0.1, duration)
    himalaya_weight = smooth_step(lats, 24.0, 28.0) * smooth_step(elevation, 300.0, 1000.0)
    peninsular_weight = smooth_step(lats, 20.0, 16.0) * smooth_step(elevation, 100.0, 500.0)
    default_weight = np.clip(1.0 - (himalaya_weight + peninsular_weight), 0.0, 1.0)
    
    I_himalaya = 58.7 * (safe_duration ** -1.12)
    I_kerala = 0.9 * (safe_duration ** -0.16)
    I_default = 10.0 * (safe_duration ** -0.5)
    
    I_crit = (himalaya_weight * I_himalaya) + (peninsular_weight * I_kerala) + (default_weight * I_default)
    
    trigger = np.zeros_like(intensity)
    valid_mask = intensity >= I_crit
    if np.any(valid_mask):
        k = 0.5
        exceedance = intensity[valid_mask] - I_crit[valid_mask]
        trigger[valid_mask] = 1.0 / (1.0 + np.exp(-k * exceedance))
        trigger[valid_mask] = np.clip((trigger[valid_mask] - 0.5) * 2.0, 0.0, 1.0)
        
    risk = giri_matrix_fusion(susceptibility, trigger)
    return risk, susceptibility, trigger

def earthquake_induced_risk(
    slope: np.ndarray, pga: np.ndarray, soil: np.ndarray, 
    elevation: np.ndarray, hist_density: np.ndarray | None = None,
    lats: np.ndarray | None = None
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    if lats is None: lats = np.ones_like(slope) * 20.0 
    susceptibility = calculate_bifurcated_susceptibility(slope, soil, elevation, hist_density, lats)
    
    is_historical = (hist_density > 0.01) if hist_density is not None else np.zeros_like(slope, dtype=bool)
    valid_region = is_historical | (slope >= 10.0)
    susceptibility[is_historical] = np.maximum(susceptibility[is_historical], 0.35)
    susceptibility[~valid_region] = 0.0
    
    Ac = 0.05 + 1.0 * (1.0 - susceptibility)
    Dn = np.zeros_like(pga)
    valid_mask = pga > Ac
    if np.any(valid_mask):
        ac_pga_ratio = Ac[valid_mask] / pga[valid_mask]
        log_dn = 0.215 + np.log10( np.power(1.0 - ac_pga_ratio, 2.34) * np.power(ac_pga_ratio, -1.43) )
        Dn[valid_mask] = np.power(10.0, log_dn)
        
    trigger = np.zeros_like(pga)
    if np.any(valid_mask):
        pof = 0.335 * (1.0 - np.exp(-0.048 * np.power(Dn[valid_mask], 1.565)))
        trigger[valid_mask] = np.clip(pof / 0.335, 0.0, 1.0)
    
    risk = giri_matrix_fusion(susceptibility, trigger)
    return risk, susceptibility, trigger

def combined_induced_risk(
    slope: np.ndarray, intensity: np.ndarray, duration: float, 
    pga: np.ndarray, soil: np.ndarray, elevation: np.ndarray, 
    lats: np.ndarray, lons: np.ndarray, hist_density: np.ndarray | None = None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    
    susceptibility = calculate_bifurcated_susceptibility(slope, soil, elevation, hist_density, lats)
    
    is_historical = (hist_density > 0.01) if hist_density is not None else np.zeros_like(slope, dtype=bool)
    valid_region = is_historical | (slope >= 10.0)
    susceptibility[is_historical] = np.maximum(susceptibility[is_historical], 0.35)
    susceptibility[~valid_region] = 0.0
    
    safe_duration = max(0.1, duration)
    himalaya_weight = smooth_step(lats, 24.0, 28.0) * smooth_step(elevation, 300.0, 1000.0)
    peninsular_weight = smooth_step(lats, 20.0, 16.0) * smooth_step(elevation, 100.0, 500.0)
    default_weight = np.clip(1.0 - (himalaya_weight + peninsular_weight), 0.0, 1.0)
    
    I_crit = (himalaya_weight * 58.7 * (safe_duration ** -1.12)) + \
             (peninsular_weight * 0.9 * (safe_duration ** -0.16)) + \
             (default_weight * 10.0 * (safe_duration ** -0.5))
             
    rain_trigger = np.zeros_like(intensity)
    rain_mask = intensity >= I_crit
    if np.any(rain_mask):
        exceedance = intensity[rain_mask] - I_crit[rain_mask]
        rain_trigger[rain_mask] = np.clip(((1.0 / (1.0 + np.exp(-0.5 * exceedance))) - 0.5) * 2.0, 0.0, 1.0)
        
    ay = np.maximum(0.01, (np.cos(np.radians(slope)) - np.sin(np.radians(slope)) * 0.5)) * 9.81
    seismic_trigger = np.zeros_like(pga)
    pga_valid_mask = pga >= ay
    if np.any(pga_valid_mask):
        dn = 10 ** (1.521 * np.log10(pga[pga_valid_mask]) - 1.993 * np.log10(ay[pga_valid_mask]) - 1.546)
        pof = 0.335 * (1 - np.exp(-0.048 * (dn ** 1.565)))
        seismic_trigger[pga_valid_mask] = np.clip(pof / 0.335, 0.0, 1.0)
        
    combined_trigger = np.clip(1.0 - (1.0 - rain_trigger) * (1.0 - seismic_trigger), 0.0, 1.0)
    
    risk = giri_matrix_fusion(susceptibility, combined_trigger)
    return risk, susceptibility, combined_trigger
