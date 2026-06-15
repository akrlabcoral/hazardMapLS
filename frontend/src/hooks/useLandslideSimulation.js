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
    useStore.setState({
      activeAlert: null,
      simulationResults: null,
      mlSimulationData: null,
      mlHeatmapVisible: false,
      mlContoursVisible: false,
    });

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
          intensity: rainfallIntensity,
          duration: rainfallDuration,
          magnitude: earthquakeMagnitude,
          depth: earthquakeDepth,
          latitude: earthquakeEpicenter.lat,
          longitude: earthquakeEpicenter.lng,
          gmpe_model: useStore.getState().gmpeModel
        };
      }

      const abortController = new AbortController();
      useStore.getState().setCurrentSimAbortController(abortController);

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
