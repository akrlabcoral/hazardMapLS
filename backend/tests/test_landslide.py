import pytest
from app.landslide.risk_model import rainfall_induced_risk, seismic_induced_risk
import numpy as np


class TestRainfallRiskModel:
    """Test rainfall-induced landslide risk calculation."""

    def test_low_risk_conditions(self):
        """Low intensity, short duration, low slope should yield low risk."""
        # Minimal intensity (1 mm/day), short duration (1 hour), flat terrain
        intensity_hr = np.array([0.04])  # 1 mm/day / 24
        duration_hr = 1.0
        slope = np.array([5.0])  # 5 degrees
        hist_density = np.array([0.0])
        soil_moisture = np.array([0.2])
        clay_content = np.array([0.1])
        seismic_factor = np.array([0.0])

        risk, susceptibility, trigger = rainfall_induced_risk(
            intensity_hr, duration_hr, slope, hist_density,
            soil_moisture, clay_content, seismic_factor
        )

        # Risk should be very low
        assert risk[0] < 0.2
        assert susceptibility[0] < 0.3
        assert trigger[0] < 0.2

    def test_high_risk_conditions(self):
        """High intensity, long duration, steep slope should yield high risk."""
        intensity_hr = np.array([10.0])  # 240 mm/day
        duration_hr = 72.0
        slope = np.array([45.0])  # 45 degrees
        hist_density = np.array([0.8])
        soil_moisture = np.array([0.8])
        clay_content = np.array([0.4])
        seismic_factor = np.array([0.5])

        risk, susceptibility, trigger = rainfall_induced_risk(
            intensity_hr, duration_hr, slope, hist_density,
            soil_moisture, clay_content, seismic_factor
        )

        # Risk should be very high
        assert risk[0] > 0.8
        assert susceptibility[0] > 0.5
        assert trigger[0] > 0.5

    def test_vectorized_calculation(self):
        """Should handle multiple cells simultaneously."""
        n = 100
        intensity_hr = np.full(n, 1.0)
        duration_hr = 24.0
        slope = np.linspace(0, 60, n)
        hist_density = np.full(n, 0.5)
        soil_moisture = np.full(n, 0.5)
        clay_content = np.full(n, 0.3)
        seismic_factor = np.full(n, 0.2)

        risk, susceptibility, trigger = rainfall_induced_risk(
            intensity_hr, duration_hr, slope, hist_density,
            soil_moisture, clay_content, seismic_factor
        )

        assert len(risk) == n
        assert len(susceptibility) == n
        assert len(trigger) == n
        # Higher slope = higher risk (monotonic)
        assert risk[-1] > risk[0]


class TestSeismicRiskModel:
    """Test seismic-induced landslide risk calculation."""

    def test_pga_scaling(self):
        """Risk should increase with PGA."""
        pga = np.array([0.01, 0.1, 0.3, 0.5])
        slope = np.array([30.0, 30.0, 30.0, 30.0])
        soil_moisture = np.array([0.3, 0.3, 0.3, 0.3])
        hist_density = np.array([0.5, 0.5, 0.5, 0.5])
        rainfall_factor = np.array([0.0, 0.0, 0.0, 0.0])

        risk, susceptibility, trigger = seismic_induced_risk(
            pga, slope, soil_moisture, hist_density, rainfall_factor
        )

        # Higher PGA = higher risk
        for i in range(len(pga) - 1):
            assert risk[i + 1] >= risk[i]

    def test_combined_effect(self):
        """Rainfall + seismic should be higher than either alone."""
        pga = np.array([0.2])
        slope = np.array([30.0])
        soil_moisture = np.array([0.5])
        hist_density = np.array([0.5])

        # No rainfall
        risk_no_rain, _, _ = seismic_induced_risk(
            pga, slope, soil_moisture, hist_density, np.array([0.0])
        )

        # With rainfall
        risk_with_rain, _, _ = seismic_induced_risk(
            pga, slope, soil_moisture, hist_density, np.array([0.8])
        )

        # Combined should be higher
        assert risk_with_rain[0] > risk_no_rain[0]
