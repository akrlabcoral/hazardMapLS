# pytest configuration
import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Shared fixtures can be added here
@pytest.fixture(scope="session")
def mock_baseline_cities():
    """Sample baseline cities for testing."""
    return [
        {
            "lat": 22.57,
            "lon": 88.36,
            "name": "Kolkata",
            "monthly_normals": {str(i): 30.0 for i in range(1, 13)}
        },
        {
            "lat": 28.61,
            "lon": 77.23,
            "name": "Delhi",
            "monthly_normals": {str(i): 32.0 for i in range(1, 13)}
        }
    ]
