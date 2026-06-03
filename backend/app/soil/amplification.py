import numpy as np

# Updated Soil amplification factors for West Bengal specific categories
SOIL_FACTORS = {
    "Rock": 0.8,
    "Lateritic": 1.0,
    "Alluvial": 1.5,
    "Deltaic": 1.8,
    "Soft sediment": 2.0
}

def apply_soil_amplification(base_pga: np.ndarray, soil_types: np.ndarray) -> np.ndarray:
    """
    Applies soil amplification factors to the base PGA.
    """
    factors = np.ones_like(base_pga, dtype=float)
    
    for soil_type, factor in SOIL_FACTORS.items():
        mask = (soil_types == soil_type)
        factors[mask] = factor
        
    adjusted_pga = base_pga * factors
    return adjusted_pga
