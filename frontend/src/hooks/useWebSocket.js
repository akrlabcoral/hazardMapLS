import { useEffect, useRef, useCallback } from 'react';
import useStore from '../store/useStore';

/**
 * useWebSocket — manages a single WebSocket connection to /api/ws/live.
 *
 * NOTE: This connection is OPTIONAL. The backend WebSocket feed provides
 * real-time earthquake event notifications, but the app works perfectly
 * for manual simulations without it. If the backend is not running or the
 * WebSocket endpoint is unavailable, this hook silently fails with no retries.
 *
 * Handles:
 *  - earthquake_detected → addLiveEvent + setActiveAlert (M≥6.0)
 *  - simulation_running  → setIsSimulationRunning(true)
 *  - simulation_complete → setSimulationResults() [same hook used by manual sim]
 *  - simulation_error    → setIsSimulationRunning(false)
 */
export function useWebSocket() {
  const wsRef = useRef(null);
  const mountedRef = useRef(true);

  const setWsConnected = useStore((s) => s.setWsConnected);
  const addLiveEvent = useStore((s) => s.addLiveEvent);
  const setActiveAlert = useStore((s) => s.setActiveAlert);
  const setSimulationResults = useStore((s) => s.setSimulationResults);
  const setIsSimulationRunning = useStore((s) => s.setIsSimulationRunning);

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'earthquake_detected':
        addLiveEvent(msg.event);
        if (msg.event.magnitude >= 6.0) {
          setActiveAlert(msg.event);
        }
        break;

      case 'simulation_running':
        if (useStore.getState().autoSimEnabled) {
          setIsSimulationRunning(true);
        }
        break;

      case 'simulation_complete':
        setIsSimulationRunning(false);
        if (useStore.getState().autoSimEnabled) {
          setSimulationResults(msg.simulation);
        }
        break;

      case 'simulation_error':
        setIsSimulationRunning(false);
        break;

      default:
        break;
    }
  }, [addLiveEvent, setActiveAlert, setSimulationResults, setIsSimulationRunning]);

  useEffect(() => {
    mountedRef.current = true;

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = location.hostname;
    const url = `${protocol}//${host}:8000/api/ws/live`;

    let ws;
    try {
      ws = new WebSocket(url);
      wsRef.current = ws;
    } catch {
      // WebSocket not supported or connection refused — silently ignore
      return;
    }

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setWsConnected(true);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        handleMessage(msg);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      // No retry — live events are optional
    };

    ws.onerror = () => {
      // Silently ignore connection errors
      // (no console spam — the backend WebSocket is optional)
    };

    return () => {
      mountedRef.current = false;
      ws?.close();
      wsRef.current = null;
    };
  }, [handleMessage, setWsConnected]);
}
