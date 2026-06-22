# HazardMap API Documentation

> Human-friendly guide to the HazardMap REST API. For interactive docs, visit `/docs` on a running backend instance.

---

## Base URL

```
Development: http://localhost:8000/api
Production:  https://your-domain.com/api
```

---

## Endpoints

### Health Check

```http
GET /api/health
```

**Response:**
```json
{ "status": "ok" }
```

---

### Heatwave Simulation

```http
POST /api/heatwave/simulate
```

Simulates heatwave conditions across India using live or custom weather data.

**Request Body:**
```json
{
  "temperature": 40.0,          // Base temperature in °C (if not live)
  "humidity": 50.0,             // Relative humidity % (if not live)
  "duration_days": 3,           // 1 to 5 days
  "is_live": true,              // Fetch live Open-Meteo data
  "uhi_enabled": false,         // Apply Urban Heat Island penalty
  "target_date_offset": 0       // -3 to +3 days from today
}
```

**Response:**
```json
{
  "forecast": [
    {
      "day": 1,
      "grid_geojson": { "type": "FeatureCollection", "features": [...] },
      "contour_geojson": { "type": "FeatureCollection", "features": [...] },
      "district_summary": { "Kolkata": { "max_wbgt": 32.5, "status": "Heatwave" } },
      "state_summary": { "West Bengal": { "max_wbgt": 33.1, "pop_at_risk": 5000000 } },
      "max_risk": 0.85
    }
  ]
}
```

---

### Landslide — Rainfall

```http
POST /api/landslide/simulate/rainfall
```

Simulates rainfall-induced landslide risk.

**Request Body:**
```json
{
  "intensity": 50.0,            // mm/day (0 to 1000)
  "duration": 1.0,              // days (0.5 to 30)
  "is_live": false,             // Use live Open-Meteo precipitation
  "target_date_offset": 0       // -3 to +3 days from today
}
```

**Response:**
```json
{
  "grid_geojson": { "type": "FeatureCollection", "features": [...] },
  "contour_geojson": { "type": "FeatureCollection", "features": [...] },
  "historical_geojson": { "type": "FeatureCollection", "features": [...] },
  "district_summary": { "Darjeeling": { "max_risk": 0.92, "cells_affected": 45 } },
  "state_summary": { "West Bengal": { "avg_risk": 0.65 } },
  "validation_stats": { "mean": 0.45, "std": 0.23 },
  "max_risk": 0.95
}
```

---

### Landslide — Earthquake

```http
POST /api/landslide/simulate/earthquake
```

Simulates seismic-induced landslide risk using PGA.

**Request Body:**
```json
{
  "magnitude": 5.0,             // 1.0 to 9.5
  "depth": 10.0,                // km (1.0 to 700.0)
  "latitude": 22.57,            // -90 to 90
  "longitude": 88.36            // -180 to 180
}
```

**Response:** Same shape as rainfall simulation.

---

### Landslide — Combined

```http
POST /api/landslide/simulate/combined
```

Simulates combined rainfall + seismic landslide risk.

**Request Body:**
```json
{
  "magnitude": 5.0,
  "depth": 10.0,
  "latitude": 22.57,
  "longitude": 88.36,
  "intensity": 50.0,
  "duration": 1.0,
  "is_live": false,
  "target_date_offset": 0
}
```

---

### Live Events (WebSocket)

```
ws://localhost:8000/api/ws/live
```

Optional real-time earthquake event feed from USGS. The connection is silent if unavailable.

**Message Types:**
- `earthquake_detected` — New earthquake from USGS feed
- `simulation_running` — Background simulation started
- `simulation_complete` — Background simulation finished
- `simulation_error` — Background simulation failed

---

### Export

```http
POST /api/export/{format}
```

Export simulation results to CSV or JSON.

**Parameters:**
- `format`: `csv` or `json`

**Request Body:**
```json
{
  "simulation_id": "uuid-here"
}
```

---

## Error Codes

| Status | Meaning | Common Cause |
|--------|---------|-------------|
| 400 | Bad Request | Invalid input parameters (Pydantic validation failed) |
| 422 | Validation Error | Missing required field or wrong type |
| 500 | Internal Server Error | Backend crash, missing data files |
| 504 | Gateway Timeout | Simulation took longer than 300 seconds |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| All simulation endpoints | No strict limit (self-hosted) |
| Open-Meteo (external) | Fair use (~10,000 requests/day per IP) |

---

*For full interactive documentation, run the backend and visit: `http://localhost:8000/docs`*
