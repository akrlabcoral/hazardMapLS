/**
 * server/src/routes/shelters.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/shelters
 *
 * Returns emergency shelters as a GeoJSON FeatureCollection.
 *
 * POSTGIS SPATIAL QUERY (already implemented):
 *   ST_DWithin(geom::geography, ST_MakePoint(lng, lat)::geography, radius)
 *
 *   This is a PostGIS geography-type distance query. Using ::geography (vs
 *   ::geometry) means distances are calculated in METERS on the spheroid
 *   rather than in degrees — critical for accurate real-world evacuation
 *   radius calculations.
 *
 * EVACUATION ROUTING INTEGRATION POINT:
 *   Future: Add `?route_from=lng,lat` parameter to trigger a pgRouting
 *   Dijkstra query from the user's location to the nearest shelter.
 *   This requires the `pgrouting` extension and a road network topology
 *   built from the `blocked_roads` table.
 *
 *   Example future query:
 *   SELECT * FROM pgr_dijkstra(
 *     'SELECT id, source, target, ST_Length(geom::geography) AS cost FROM roads',
 *     start_vertex, end_vertex, directed => false
 *   );
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import { query } from '../config/db.js';
import { rowsToFeatureCollection } from '../utils/geojsonHelper.js';

const router = Router();

/**
 * GET /api/shelters
 * Query params:
 *   status        — filter by shelter status ('open', 'full', 'closed')
 *   lng, lat      — center point for spatial proximity query
 *   radius        — search radius in METERS (requires lng + lat)
 */
router.get('/', async (req, res, next) => {
  try {
    const { lng, lat, radius, status } = req.query;

    let sql = `
      SELECT
        id, name, capacity, occupancy, status,
        ST_AsGeoJSON(geom) AS geojson,
        created_at, updated_at
      FROM shelters
      WHERE 1=1
    `;
    const params = [];
    let p = 1;

    if (status) { sql += ` AND status = $${p++}`; params.push(status); }

    // PostGIS ST_DWithin spatial filter — geography type for meter-accurate distances
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
