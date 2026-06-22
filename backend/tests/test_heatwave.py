import pytest
from app.heatwave.heatwave_classification import classify_heatwave, get_risk_score
from app.heatwave.heatwave_analysis import calculate_wbgt_and_anomaly


class TestHeatwaveClassification:
    """Test IMD-based heatwave classification logic."""

    def test_normal_conditions(self):
        """Below all thresholds should return Normal."""
        result = classify_heatwave(wbgt=28.0, anomaly=2.0, max_temp=35.0, elevation=100.0)
        assert result == "Normal"

    def test_warm_conditions(self):
        """WBGT >= 30 or max_temp >= 40 but below heatwave thresholds."""
        result = classify_heatwave(wbgt=31.0, anomaly=3.0, max_temp=42.0, elevation=100.0)
        assert result == "Warm"

    def test_heatwave_plains(self):
        """Plains: anomaly >= 4.5 or max_temp >= 45."""
        result = classify_heatwave(wbgt=32.0, anomaly=5.0, max_temp=43.0, elevation=100.0)
        assert result == "Heatwave"

    def test_severe_heatwave_plains(self):
        """Plains: anomaly > 6.4 or max_temp >= 47."""
        result = classify_heatwave(wbgt=33.0, anomaly=7.0, max_temp=45.0, elevation=100.0)
        assert result == "Severe Heatwave"

    def test_extreme_heatwave_wbgt(self):
        """WBGT >= 35 should override everything."""
        result = classify_heatwave(wbgt=36.0, anomaly=0.0, max_temp=30.0, elevation=100.0)
        assert result == "Extreme Heatwave"

    def test_hilly_region_heatwave(self):
        """Hilly: max_temp >= 30 and anomaly >= 4.5."""
        result = classify_heatwave(wbgt=30.0, anomaly=5.0, max_temp=32.0, elevation=1200.0)
        assert result == "Heatwave"

    def test_risk_score_mapping(self):
        """Risk scores should map correctly."""
        assert get_risk_score("Normal") == 0.0
        assert get_risk_score("Warm") == 0.4
        assert get_risk_score("Heatwave") == 0.6
        assert get_risk_score("Severe Heatwave") == 0.8
        assert get_risk_score("Extreme Heatwave") == 1.0


class TestHeatwaveAnalysis:
    """Test WBGT and anomaly calculation physics."""

    def test_calculate_wbgt_basic(self):
        """WBGT should increase with temperature and humidity."""
        # Flat terrain, no UHI, baseline = 30
        live_temp = [40.0, 40.0, 40.0]
        live_hum = [50.0, 50.0, 50.0]
        baseline_temp = [30.0, 30.0, 30.0]
        elevation = [0.0, 0.0, 0.0]
        urban_mask = [0.0, 0.0, 0.0]

        wbgt, anomaly, adj_temp = calculate_wbgt_and_anomaly(
            live_temp=live_temp,
            live_humidity=live_hum,
            baseline_temp=baseline_temp,
            elevation=elevation,
            duration_days=1,
            urban_mask=urban_mask
        )

        # Anomaly should be 10 degrees (40 - 30)
        assert anomaly[0] == pytest.approx(10.0, rel=0.1)
        # WBGT should be high (hot + humid)
        assert wbgt[0] > 30.0

    def test_uhi_penalty(self):
        """Urban Heat Island should increase temperature."""
        live_temp = [35.0, 35.0]
        live_hum = [50.0, 50.0]
        baseline_temp = [30.0, 30.0]
        elevation = [0.0, 0.0]

        # Without UHI
        wbgt_no_uhi, _, _ = calculate_wbgt_and_anomaly(
            live_temp=live_temp, live_humidity=live_hum,
            baseline_temp=baseline_temp, elevation=elevation,
            duration_days=1, urban_mask=[0.0, 0.0]
        )

        # With UHI
        wbgt_uhi, _, _ = calculate_wbgt_and_anomaly(
            live_temp=live_temp, live_humidity=live_hum,
            baseline_temp=baseline_temp, elevation=elevation,
            duration_days=1, urban_mask=[1.0, 1.0]
        )

        # UHI should increase WBGT
        assert wbgt_uhi[0] > wbgt_no_uhi[0]

    def test_duration_cumulative_effect(self):
        """Longer duration should increase WBGT."""
        live_temp = [38.0]
        live_hum = [50.0]
        baseline_temp = [30.0]
        elevation = [0.0]
        urban_mask = [0.0]

        wbgt_day1, _, _ = calculate_wbgt_and_anomaly(
            live_temp=live_temp, live_humidity=live_hum,
            baseline_temp=baseline_temp, elevation=elevation,
            duration_days=1, urban_mask=urban_mask
        )

        wbgt_day5, _, _ = calculate_wbgt_and_anomaly(
            live_temp=live_temp, live_humidity=live_hum,
            baseline_temp=baseline_temp, elevation=elevation,
            duration_days=5, urban_mask=urban_mask
        )

        # Day 5 should have higher WBGT than Day 1 (cumulative heat stress)
        assert wbgt_day5[0] >= wbgt_day1[0]
