import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestHealthEndpoint:
    """Test basic API connectivity."""

    def test_health_check(self):
        """Health endpoint should return 200."""
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestHeatwaveEndpoint:
    """Test heatwave simulation API."""

    def test_heatwave_simulation_custom(self):
        """Custom heatwave simulation should return forecast array."""
        payload = {
            "temperature": 42.0,
            "humidity": 60.0,
            "duration_days": 1,
            "is_live": False,
            "uhi_enabled": False,
            "target_date_offset": 0
        }
        response = client.post("/api/heatwave/simulate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "forecast" in data
        assert len(data["forecast"]) == 1
        assert "grid_geojson" in data["forecast"][0]
        assert "contour_geojson" in data["forecast"][0]

    def test_heatwave_input_validation(self):
        """Invalid inputs should return 422."""
        payload = {
            "temperature": 42.0,
            "humidity": 60.0,
            "duration_days": 10,  # Invalid: max is 5
            "is_live": False,
            "uhi_enabled": False
        }
        response = client.post("/api/heatwave/simulate", json=payload)
        assert response.status_code == 422


class TestLandslideEndpoint:
    """Test landslide simulation API."""

    def test_rainfall_simulation(self):
        """Rainfall simulation should return grid and contours."""
        payload = {
            "intensity": 50.0,
            "duration": 1.0,
            "is_live": False,
            "target_date_offset": 0
        }
        response = client.post("/api/landslide/simulate/rainfall", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "grid_geojson" in data
        assert "contour_geojson" in data
        assert "district_summary" in data

    def test_earthquake_input_validation(self):
        """Invalid magnitude should return 422."""
        payload = {
            "magnitude": 15.0,  # Invalid: max is 9.5
            "depth": 10.0,
            "latitude": 22.57,
            "longitude": 88.36
        }
        response = client.post("/api/landslide/simulate/earthquake", json=payload)
        assert response.status_code == 422
