/**
 * src/hooks/useSimulation.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Simulation trigger hook — dual-path earthquake simulation.
 *
 * PATH 1 — Hybrid REST/Socket.IO (Online Mode):
 *   When connected, sends a POST request to /api/simulate/start.
 *   The server runs the simulation, persists to PostGIS, and broadcasts
 *   `simulation:update` to all clients via Socket.IO.
 *
 * PATH 2 — Local fallback (offline mode):
 *   When disconnected, runs the simulation engine directly in the browser 
 *   and updates the store immediately.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useCallback } from 'react';
import useStore from '../store/useStore';
import { runSimulation } from '../services/simulationEngine';
import { fetchGeoJson }  from '../services/geoJsonLoader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export function useSimulation() {
  const earthquakeEpicenter  = useStore((s) => s.earthquakeEpicenter);
  const earthquakeMagnitude  = useStore((s) => s.earthquakeMagnitude);
  const earthquakeDepth      = useStore((s) => s.earthquakeDepth);
  const aftershocksEnabled   = useStore((s) => s.aftershocksEnabled);
  const isSimulationRunning  = useStore((s) => s.isSimulationRunning);
  const wsStatus             = useStore((s) => s.wsStatus);

  const setSimulationResults   = useStore((s) => s.setSimulationResults);
  const setIsSimulationRunning = useStore((s) => s.setIsSimulationRunning);
  const setRealtimeMode        = useStore((s) => s.setRealtimeMode);

  const handleRunSimulation = useCallback(async () => {
    if (!earthquakeEpicenter || isSimulationRunning) return;

    setIsSimulationRunning(true);

    // ── PATH 1: REST API → Server-side simulation & PostGIS ───────────────
    if (wsStatus === 'connected') {
      try {
        const response = await fetch(`${API_URL}/simulate/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            epicenter:   earthquakeEpicenter,
            magnitude:   earthquakeMagnitude,
            depth:       earthquakeDepth,
            aftershocks: aftershocksEnabled,
          })
        });

        if (response.ok) {
          // Socket.IO hook will receive 'simulation:update' and update the UI
          return;
        } else {
          console.warn('[Sim] REST API failed — falling back to local engine');
        }
      } catch (err) {
        console.warn('[Sim] REST API error — falling back to local engine', err);
      }
    }

    // ── PATH 2: Local simulation (offline fallback) ───────────────────────
    try {
      const [buildingsData, roadsData] = await Promise.all([
        fetchGeoJson('buildings.geojson'),
        fetchGeoJson('roads.geojson'),
      ]);

      const results = runSimulation(
        earthquakeEpicenter,
        earthquakeMagnitude,
        earthquakeDepth,
        aftershocksEnabled,
        buildingsData,
        roadsData,
      );

      setSimulationResults(results);
      setRealtimeMode(false); // Mark as local result, not server-pushed
    } catch (err) {
      console.error('[Sim] Local simulation error:', err);
    } finally {
      setIsSimulationRunning(false);
    }
  }, [
    earthquakeEpicenter, earthquakeMagnitude, earthquakeDepth,
    aftershocksEnabled,  isSimulationRunning, wsStatus,
    setSimulationResults, setIsSimulationRunning, setRealtimeMode,
  ]);

  return { handleRunSimulation };
}
