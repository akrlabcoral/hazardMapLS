import { useCallback, useState } from 'react';
import useStore from '../store/useStore';

export function useSimulation() {
  const earthquakeEpicenter  = useStore((s) => s.earthquakeEpicenter);
  const earthquakeMagnitude  = useStore((s) => s.earthquakeMagnitude);
  const earthquakeDepth      = useStore((s) => s.earthquakeDepth);
  
  const setSimulationResults   = useStore((s) => s.setSimulationResults);
  const setIsSimulationRunning = useStore((s) => s.setIsSimulationRunning);
  
  const [error, setError] = useState(null);

  const handleRunSimulation = useCallback(async () => {
    if (!earthquakeEpicenter) return;

    setIsSimulationRunning(true);
    setError(null);
    setSimulationResults(null); // Clear previous

    try {
      const gmpeModel = useStore.getState().gmpeModel;
      
      const response = await fetch('/scientific-api/simulate-earthquake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: earthquakeEpicenter.lat,
          longitude: earthquakeEpicenter.lng,
          magnitude: earthquakeMagnitude,
          depth: earthquakeDepth,
          gmpe_model: gmpeModel
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || `Server returned ${response.status}`);
      }

      const geojsonData = await response.json();
      setSimulationResults(geojsonData);
      
    } catch (err) {
      console.error('[Sim] Scientific API error:', err);
      setError(err.message);
    } finally {
      setIsSimulationRunning(false);
    }
  }, [
    earthquakeEpicenter, earthquakeMagnitude, earthquakeDepth,
    setSimulationResults, setIsSimulationRunning
  ]);

  return { handleRunSimulation, error };
}
