/**
 * server/src/routes/simulate.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Hybrid REST API + Socket.IO Simulation Router
 * Supports:
 *   POST /api/simulate/start
 *   POST /api/simulate/stop
 *   GET  /api/simulate/status
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import { getClient, query } from '../config/db.js';
import { runSimulation } from '../../../src/services/simulationEngine.js';
import { getIO } from '../socket/index.js';

const router = Router();

// Store active simulation state in-memory
let activeSimulation = {
  isRunning: false,
  startTime: null,
  params: null
};

/**
 * POST /api/simulate/start
 * Starts the simulation, persists major changes to PostGIS, and broadcasts via Socket.IO
 */
router.post('/start', async (req, res, next) => {
  try {
    const { epicenter, magnitude, depth, aftershocks } = req.body;

    if (!epicenter || typeof epicenter.lng !== 'number' || typeof epicenter.lat !== 'number') {
      return res.status(400).json({ error: 'Invalid epicenter.' });
    }
    if (!magnitude || magnitude < 1 || magnitude > 10) {
      return res.status(400).json({ error: 'magnitude must be a number between 1 and 10.' });
    }

    activeSimulation = {
      isRunning: true,
      startTime: new Date(),
      params: { epicenter, magnitude, depth, aftershocks }
    };

    // ── Fetch Spatial Data from PostGIS ────────────────────────────────────
    const buildingsResult = await query(`
      SELECT
        id, name, 'hospital' AS type, capacity AS floors, 2000 AS year_built,
        ST_AsGeoJSON(geom) AS geojson
      FROM hospitals
      UNION ALL
      SELECT
        id + 10000, name, 'shelter' AS type, capacity AS floors, 2000 AS year_built,
        ST_AsGeoJSON(geom) AS geojson
      FROM shelters
    `);

    const roadsResult = await query(`
      SELECT id, road_name AS name, blocked, lanes,
             ST_AsGeoJSON(geom) AS geojson
      FROM blocked_roads
    `);

    const buildingsGeoJson = {
      type: 'FeatureCollection',
      features: buildingsResult.rows.map(row => ({
        type: 'Feature',
        geometry: JSON.parse(row.geojson),
        properties: { name: row.name, type: row.type, floors: row.floors }
      }))
    };

    const roadsGeoJson = {
      type: 'FeatureCollection',
      features: roadsResult.rows.map(row => ({
        type: 'Feature',
        geometry: JSON.parse(row.geojson),
        properties: { name: row.name, blocked: row.blocked, lanes: row.lanes }
      }))
    };

    // ── Run Simulation ──────────────────────────────────────────────────────
    const results = runSimulation(
      epicenter,
      magnitude,
      depth || 10,
      aftershocks || false,
      buildingsGeoJson,
      roadsGeoJson
    );

    // ── Database Persistence ───────────────────────────────────────────────
    // Persist only major simulation runs as per architecture decision
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      // Clear old hazard zones (optional, or append with timestamp)
      // For this demo, let's just insert new ones
      for (const zone of results.hazardZones.features) {
        await client.query(
          `INSERT INTO hazard_zones (zone_type, risk_level, geom)
           VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326))`,
          [zone.properties.zone, zone.properties.risk, JSON.stringify(zone.geometry)]
        );
      }

      // Record major event in incidents table
      await client.query(
        `INSERT INTO incidents (type, magnitude, depth, description, geom)
         VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326))`,
        ['earthquake_simulation', magnitude, depth || 10, 'Triggered via REST API', epicenter.lng, epicenter.lat]
      );

      await client.query('COMMIT');
      console.log('[DB] Major simulation run persisted to PostGIS.');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('[DB] Failed to persist simulation:', e);
      // We log but do not block the broadcast
    } finally {
      client.release();
    }

    // ── Broadcast via Socket.IO ─────────────────────────────────────────────
    const io = getIO();
    io.emit('simulation:update', {
      ...results,
      meta: {
        triggeredAt: activeSimulation.startTime.toISOString(),
        source: 'REST API',
        epicenter,
        magnitude,
        depth: depth || 10,
        aftershocksEnabled: aftershocks || false,
      },
    });

    res.json({ success: true, simulation: results });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/simulate/stop
 * Stops the active simulation (if any) and broadcasts simulation:end
 */
router.post('/stop', (req, res) => {
  if (activeSimulation.isRunning) {
    activeSimulation.isRunning = false;
    
    // Broadcast end event
    const io = getIO();
    io.emit('simulation:end', {
      endedAt: new Date().toISOString(),
      durationMs: new Date() - activeSimulation.startTime
    });
  }

  res.json({ success: true, message: 'Simulation stopped' });
});

/**
 * GET /api/simulate/status
 * Returns the current active simulation state
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: activeSimulation.isRunning ? 'running' : 'idle',
    details: activeSimulation
  });
});

export default router;
