import { useCallback } from 'react';
import useStore from '../store/useStore';

export function useLandslideSimulation() {
  const {
    rainfallIntensity,
    rainfallDuration,
    setSimulationResults,
    setIsSimulationRunning,
    activeAlert,
    setActiveAlert
  } = useStore();

  const handleRunSimulation = useCallback(async () => {
    setIsSimulationRunning(true);
    useStore.setState({
      activeAlert: null,
      simulationResults: null,
      mlSimulationData: null,
      mlHeatmapVisible: false,
      mlContoursVisible: false,
    });

    const abortController = new AbortController();
    useStore.getState().setCurrentSimAbortController(abortController);

    try {
      const endpoint = '/api/landslide/simulate/rainfall';
      const payload = {
        intensity: rainfallIntensity,
        duration: rainfallDuration,
        is_live: useStore.getState().isLiveRainfall,
        target_date_offset: useStore.getState().targetDateOffset
      };

      const response = await fetch(endpoint.replace('/api', '/scientific-api'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortController.signal
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
      
      // Restore the accurate backend contour polygons!
      setSimulationResults(data);
      
      // Explicitly keep the old blocky heatmap layers off for Landslides
      useStore.getState().setMlHeatmapVisible(false);
      useStore.getState().setMlContoursVisible(false);
      
      // Do not force validation dots on; let the user's GIS toggle handle it.
      
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[useLandslideSimulation] Simulation fetch aborted by user.');
        return;
      }
      console.error('[useLandslideSimulation] Error:', err);
      setActiveAlert({ type: 'error', message: err.message || 'Simulation failed' });
    } finally {
      setIsSimulationRunning(false);
      useStore.getState().setCurrentSimAbortController(null);
    }
  }, [
    rainfallIntensity, 
    rainfallDuration, 
    setSimulationResults, 
    setIsSimulationRunning,
    setActiveAlert,
    activeAlert
  ]);

  return { handleRunSimulation };
}
