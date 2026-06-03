import numpy as np

class GMPEModel:
    """
    Base class for Ground Motion Prediction Equations (GMPE).
    Subclasses must implement calculate_pga(magnitude, hypocentral_distance).
    """
    def calculate_pga(self, magnitude: float, hypocentral_distance: np.ndarray) -> np.ndarray:
        raise NotImplementedError("Subclasses must implement this method")

class HimalayanGMPE(GMPEModel):
    """
    Himalayan GMPE model.
    Characterized by strong near-source shaking but faster attenuation 
    due to complex tectonic structure.
    """
    def calculate_pga(self, magnitude: float, hypocentral_distance: np.ndarray) -> np.ndarray:
        R = np.clip(hypocentral_distance, 1.0, None)
        # Custom coefficients for Himalayan region
        c1 = -0.10
        c2 = 0.25
        c3 = -0.05
        c4 = -0.003
        
        ln_pga = c1 + c2*(magnitude - 6.0) + c3*((magnitude - 6.0)**2) + c4*R - 1.1*np.log(R)
        return np.exp(ln_pga)

class ContinentalGMPE(GMPEModel):
    """
    Stable Continental Region (SCR) GMPE model.
    Characterized by slower attenuation (energy travels further) 
    typical of cratons/shield regions.
    """
    def calculate_pga(self, magnitude: float, hypocentral_distance: np.ndarray) -> np.ndarray:
        R = np.clip(hypocentral_distance, 1.0, None)
        # Custom coefficients for Continental region
        c1 = -0.20
        c2 = 0.20
        c3 = -0.02
        c4 = -0.001
        
        ln_pga = c1 + c2*(magnitude - 6.0) + c3*((magnitude - 6.0)**2) + c4*R - 0.9*np.log(R)
        return np.exp(ln_pga)

class IndianShieldGMPE(GMPEModel):
    """
    Generic Indian Shield GMPE model.
    A hybrid model balanced for the peninsular Indian shield.
    """
    def calculate_pga(self, magnitude: float, hypocentral_distance: np.ndarray) -> np.ndarray:
        R = np.clip(hypocentral_distance, 1.0, None)
        # Custom coefficients for Indian Shield
        c1 = -0.15
        c2 = 0.22
        c3 = -0.04
        c4 = -0.002
        
        ln_pga = c1 + c2*(magnitude - 6.0) + c3*((magnitude - 6.0)**2) + c4*R - 1.0*np.log(R)
        return np.exp(ln_pga)

# Factory to get the correct model
def get_gmpe_model(model_name: str) -> GMPEModel:
    models = {
        "himalayan": HimalayanGMPE(),
        "continental": ContinentalGMPE(),
        "indian_shield": IndianShieldGMPE()
    }
    return models.get(model_name.lower(), IndianShieldGMPE()) # Default to Indian Shield
