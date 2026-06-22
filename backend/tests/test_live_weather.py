import pytest
from app.landslide.live_weather import fetch_live_forecast, get_interpolated_precipitation
import numpy as np


class TestLiveWeather:
    """Test Open-Meteo integration."""

    def test_fetch_forecast_structure(self):
        """Forecast should have expected structure."""
        cities = [
            {"lat": 22.57, "lon": 88.36, "name": "Kolkata"},
            {"lat": 28.61, "lon": 77.23, "name": "Delhi"}
        ]
        data = fetch_live_forecast(cities)

        assert isinstance(data, list)
        assert len(data) == 2
        for city_data in data:
            assert "daily" in city_data
            assert "temperature_2m_max" in city_data["daily"]
            assert "relative_humidity_2m_mean" in city_data["daily"]
            assert len(city_data["daily"]["temperature_2m_max"]) >= 7

    def test_interpolated_precipitation(self):
        """Interpolation should return array matching grid size."""
        lons = np.array([88.0, 88.5, 89.0])
        lats = np.array([22.0, 22.5, 23.0])

        result = get_interpolated_precipitation(lons, lats, target_date_offset=0)

        assert isinstance(result, np.ndarray)
        assert len(result) == len(lons)
        # Values should be non-negative (precipitation can't be negative)
        assert np.all(result >= 0)
