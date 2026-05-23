/**
 * server/src/routes/earthquakes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/earthquakes
 *
 * Returns historical earthquake incidents as a GeoJSON FeatureCollection.
 * All geometry is stored as PostGIS POINT (EPSG:4326) and converted to
 * GeoJSON on the fly using ST_AsGeoJSON() — no post-processing in JS.
 *
 * POSTGIS INTEGRATION POINTS:
 *   • Add `?bbox=minLng,minLat,maxLng,maxLat` → ST_MakeEnvelope + ST_Within
 *     for viewport-bounded queries (essential for large datasets).
 *   • Add `?radius=5000&lng=88.36&lat=22.57` → ST_DWithin (already in
 *     shelters/hospitals routes — mirror here for consistency).
 *
 * FUTURE: Connect to a live USGS/IMD seismic feed via a background job
 * that POSTs new incidents to the database every 60 seconds, then broadcasts
 * a WebSocket event ('NEW_EARTHQUAKE') to all connected clients.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import { query } from '../config/db.js';
import { rowsToFeatureCollection } from '../utils/geojsonHelper.js';

const router = Router();

/**
 * GET /api/earthquakes
 * Query params:
 *   magnitude_min  — minimum magnitude filter
 *   magnitude_max  — maximum magnitude filter
 *   limit          — max results (default 100)
 */
router.get('/', async (req, res, next) => {
  try {
    const { magnitude_min, magnitude_max, limit = 100 } = req.query;

    let sql = `
      SELECT
        id, type, magnitude, depth, description, occurred_at,
        ST_AsGeoJSON(geom) AS geojson,
        created_at, updated_at
      FROM incidents
      WHERE type IN ('earthquake', 'aftershock')
    `;
    const params = [];
    let p = 1;

    if (magnitude_min) { sql += ` AND magnitude >= $${p++}`; params.push(parseFloat(magnitude_min)); }
    if (magnitude_max) { sql += ` AND magnitude <= $${p++}`; params.push(parseFloat(magnitude_max)); }

    sql += ` ORDER BY occurred_at DESC LIMIT $${p}`;
    params.push(parseInt(limit));

    const result = await query(sql, params);
    res.json(rowsToFeatureCollection(result.rows));
  } catch (err) {
    next(err);
  }
});

export default router;
