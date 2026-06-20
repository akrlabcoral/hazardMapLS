import { useEffect, useRef, useCallback } from 'react';
import useStore from '../store/useStore';

/**
 * useWebSocket — manages a single WebSocket connection to /scientific-api/ws/live.
 *
 * Handles:
 *  - Auto-reconnect on disconnect (3s delay)
 *  - Heartbeat pings (ignored silently)
 *  - earthquake_detected → addLiveEvent + setActiveAlert (M≥6.0)
 *  - simulation_running  → setIsSimulationRunning(true)
 *  - simulation_complete → setSimulationResults() [same hook used by manual sim]
 *  - simulation_error    → setIsSimulationRunning(false)
 *
 * Mount once at the app root (e.g., in Dashboard.jsx).
 */
export function useWebSocket() {
  const wsRef      = useRef(null);
  const retryRef   = useRef(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  const setWsConnected     = useStore((s) => s.setWsConnected);
  const addLiveEvent       = useStore((s) => s.addLiveEvent);
  const setActiveAlert     = useStore((s) => s.setActiveAlert);
  const setSimulationResults   = useStore((s) => s.setSimulationResults);
  const setIsSimulationRunning = useStore((s) => s.setIsSimulationRunning);
  // autoSimEnabled is read via useStore.getState() inside handleMessage
  // to avoid causing a WebSocket reconnect when the toggle changes.

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'ping':
        // Heartbeat — ignore
        break;

      case 'earthquake_detected':
        addLiveEvent(msg.event);
        if (msg.event.magnitude >= 6.0) {
          setActiveAlert(msg.event);
        }
        break;

      case 'simulation_running':
        // Read autoSimEnabled at call time to avoid stale closure / reconnect loop
        if (useStore.getState().autoSimEnabled) {
          setIsSimulationRunning(true);
        }
        break;

      case 'simulation_complete':
        setIsSimulationRunning(false);
        if (useStore.getState().autoSimEnabled) {
          // Exact same setter used by manual simulation — zero map code changes
          setSimulationResults(msg.simulation);
        }
        break;

      case 'simulation_error':
        setIsSimulationRunning(false);
        console.warn('[WS] Auto-simulation error:', msg.error);
        break;

      default:
        break;
    }
  }, [addLiveEvent, setActiveAlert, setSimulationResults, setIsSimulationRunning]);
  // Note: autoSimEnabled intentionally omitted from deps — read via getState() above
  // to avoid triggering a WebSocket reconnect every time the toggle changes.

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (retryCountRef.current >= 5) {
      console.log('[WS] Max retry attempts reached. Live events disabled.');
      return;
    }

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect directly to backend port 8000 to avoid Vite proxy WebSocket issues in Docker
    const host = location.hostname;
    const url = `${protocol}//${host}:8000/api/ws/live`;

    console.log('[WS] Connecting to', url);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      retryCountRef.current = 0; // Reset retries on success
      setWsConnected(true);
      console.log('[WS] Connected');
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        handleMessage(msg);
      } catch (err) {
        console.warn('[WS] Failed to parse message:', err);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      if (mountedRef.current) {
        retryCountRef.current += 1;
        const delay = Math.min(3000 * retryCountRef.current, 30000); // Exponential backoff capped at 30s
        console.log(`[WS] Disconnected — reconnecting in ${delay}ms... (attempt ${retryCountRef.current}/5)`);
        retryRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = (err) => {
      console.warn('[WS] Error:', err);
    };
  }, [handleMessage, setWsConnected]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);
}
