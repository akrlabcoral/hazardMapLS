/**
 * src/hooks/useSocket.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom React hook for persistent Socket.IO communication with the HazardMap backend.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useStore from '../store/useStore';
import throttle from 'lodash/throttle';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5001';

export function useSocket() {
  const socketRef = useRef(null);
  
  const setWsStatus = useStore((s) => s.setWsStatus);
  const setSimulationResults = useStore((s) => s.setSimulationResults);
  const setIsSimulationRunning = useStore((s) => s.setIsSimulationRunning);
  const setRealtimeMode = useStore((s) => s.setRealtimeMode);
  const addLiveEarthquake = useStore((s) => s.addLiveEarthquake);

  // Throttle rapid live earthquake feeds to 1 update per 500ms max
  // to avoid React/Zustand render thrashing
  // NOTE: Disabled synthetic feed listening in favor of static JSON feed
  // const throttledAddEarthquake = useCallback(
  //   throttle((feature) => {
  //     addLiveEarthquake(feature);
  //   }, 500, { leading: true, trailing: true }),
  //   [addLiveEarthquake]
  // );

  useEffect(() => {
    setWsStatus('connecting');
    console.log(`[Socket.IO] Connecting to ${SOCKET_URL}`);

    const socket = io(SOCKET_URL, {
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected', socket.id);
      setWsStatus('connected');
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Disconnected: ${reason}`);
      setWsStatus('disconnected');
      setRealtimeMode(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection error:', err.message);
      setWsStatus('error');
    });

    // ── Domain Events ──────────────────────────────────────────────────────
    socket.on('simulation:update', (payload) => {
      if (payload.message) {
        console.log('[Socket.IO] System:', payload.message);
        return;
      }
      setSimulationResults(payload);
      setIsSimulationRunning(false);
      setRealtimeMode(true);
    });

    socket.on('simulation:end', (payload) => {
      console.log('[Socket.IO] Simulation ended:', payload);
      setIsSimulationRunning(false);
    });

    socket.on('live_feed', (feature) => {
      // NOTE: Ignored to remove dependence on synthetic point generation
      // throttledAddEarthquake(feature);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [setWsStatus, setSimulationResults, setIsSimulationRunning, setRealtimeMode]);

  const send = useCallback((event, payload) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('[Socket.IO] Cannot emit — not connected.');
      return false;
    }
    socketRef.current.emit(event, payload);
    return true;
  }, []);

  return { send };
}
