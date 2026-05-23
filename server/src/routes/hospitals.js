/**
 * server/src/routes/hospitals.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/hospitals
 *
 * Returns hospitals as a GeoJSON FeatureCollection.
 * Supports PostGIS ST_DWithin spatial proximity filtering (radius in meters).
 *
 * DISASTER TRIAGE INTEGRATION POINT:
 *   During an active earthquake event, this endpoint can be extended to:
 *   1. Filter hospitals by `available_beds > 0` to surface functional
 *      medical capacity in real time.
 *   2. Sort by `ST_Distance(geom::geography, epicenter::geography)` so
 *      the nearest operational hospital appears first — critical for
 *      routing injured people during the first 72 hours.
 *
 * RASTER INTEGRATION POINT:
 *   Future: Cross-reference hospital locations against flood-risk rasters
 *   (PostGIS Raster / ST_Value) to flag hospitals at flood risk during
 *   compound disaster events (earthquake + tsunami / flash flood).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import { query } from '../config/db.js';
import { rowsToFeatureCollection } from '../utils/geojsonHelper.js';

const router = Router();

/**
 * GET /api/hospitals
 * Query params:
 *   emergency_level — filter by level ('normal', 'high', 'critical')
 *   lng, lat        — center for spatial proximity query
 *   radius          — search radius in METERS (requires lng + lat)
 */
router.get('/', async (req, res, next) => {
  try {
    const { lng, lat, radius, emergency_level } = req.query;

    let sql = `
      SELECT
        id, name, capacity, available_beds, emergency_level,
        ST_AsGeoJSON(geom) AS geojson,
        created_at, updated_at
      FROM hospitals
      WHERE 1=1
    `;
    const params = [];
    let p = 1;

    if (emergency_level) { sql += ` AND emergency_level = $${p++}`; params.push(emergency_level); }

    // PostGIS ST_DWithin — geography type gives meter-accurate radius
    if (lng && lat && radius) {
      sql += `
        AND ST_DWithin(
          geom::geography,
          ST_SetSRID(ST_MakePoint($${p++}, $${p++}), 4326)::geography,
          $${p++}
        )
      `;
      params.push(parseFloat(lng), parseFloat(lat), parseFloat(radius));
    }

    sql += ' ORDER BY name';

    const result = await query(sql, params);
    res.json(rowsToFeatureCollection(result.rows));
  } catch (err) {
    next(err);
  }
});

export default router;
