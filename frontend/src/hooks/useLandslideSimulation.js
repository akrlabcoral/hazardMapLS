import { useCallback } from 'react';
import useStore from '../store/useStore';

export function useLandslideSimulation() {
  const {
    landslideType,
    earthquakeEpicenter,
    earthquakeMagnitude,
    earthquakeDepth,
    gmpeParams,
    useCustomGmpe,
    rainfallIntensity,
    rainfallDuration,
    setSimulationResults,
    setIsSimulationRunning,
    activeAlert,
    setActiveAlert
  } = useStore();

  const handleRunSimulation = useCallback(async () => {
    if (landslideType !== 'rainfall' && !earthquakeEpicenter) {
      if (activeAlert?.type !== 'info') {
        setActiveAlert({ type: 'info', message: 'Please drop a pin on the map to set the earthquake epicenter first.' });
      }
      return;
    }

    setIsSimulationRunning(true);
    useStore.setState({ activeAlert: null }); // Clear any previous alerts

    try {
      let endpoint = '';
      let payload = {};

      if (landslideType === 'rainfall') {
        endpoint = '/api/landslide/simulate/rainfall';
        payload = {
          intensity: rainfallIntensity,
          duration: rainfallDuration
        };
      } else if (landslideType === 'earthquake') {
        endpoint = '/api/landslide/simulate/earthquake';
        payload = {
          magnitude: earthquakeMagnitude,
          depth: earthquakeDepth,
          latitude: earthquakeEpicenter.lat,
          longitude: earthquakeEpicenter.lng
        };
      } else if (landslideType === 'combined') {
        endpoint = '/api/landslide/simulate/combined';
        payload = {
          magnitude: earthquakeMagnitude,
          depth: earthquakeDepth,
          latitude: earthquakeEpicenter.lat,
          longitude: earthquakeEpicenter.lng,
          intensity: rainfallIntensity,
          duration: rainfallDuration
        };
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        let errorMsg = errorData?.detail || `API Error: ${response.status}`;
        if (typeof errorMsg !== 'string') {
          errorMsg = JSON.stringify(errorMsg);
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setSimulationResults(data);
      
      // If validation stats exist and accuracy > 0, we can auto-show them in a panel or alert
      if (data.validation_stats && data.validation_stats.total_historical_events > 0) {
        useStore.setState({ historicalValidationVisible: true });
      }
      
    } catch (err) {
      console.error('[useLandslideSimulation] Error:', err);
      setActiveAlert({ type: 'error', message: err.message || 'Simulation failed' });
    } finally {
      setIsSimulationRunning(false);
    }
  }, [
    landslideType, 
    earthquakeEpicenter, 
    rainfallIntensity, 
    rainfallDuration, 
    setSimulationResults, 
    setIsSimulationRunning,
    setActiveAlert,
    activeAlert
  ]);

  return { handleRunSimulation };
}
