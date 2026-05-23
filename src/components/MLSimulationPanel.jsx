import React, { useState } from 'react';
import { Play, RefreshCw, Layers } from 'lucide-react';
import useStore from '../store/useStore';

export default function MLSimulationPanel() {
  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.2090);
  const [magnitude, setMagnitude] = useState(7.2);
  const [depth, setDepth] = useState(15);
  const [radiusKm, setRadiusKm] = useState(300);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mlHeatmapVisible = useStore((state) => state.mlHeatmapVisible);
  const setMlHeatmapVisible = useStore((state) => state.setMlHeatmapVisible);
  const mlContoursVisible = useStore((state) => state.mlContoursVisible);
  const setMlContoursVisible = useStore((state) => state.setMlContoursVisible);
  const setMlSimulationData = useStore((state) => state.setMlSimulationData);

  const handleSimulate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/ml-api/simulate-earthquake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, magnitude, depth, radius_km: radiusKm }),
      });
      if (!response.ok) {
        throw new Error('Failed to run ML simulation');
      }
      const data = await response.json();
      
      // Update global store with the new heatmap points
      setMlSimulationData(data.heatmap);
      setMlHeatmapVisible(true); // Auto-show heatmap
      setMlContoursVisible(true); // Auto-show contours
      
      // Also jump map to the epicenter
      // If we had a direct map reference we could flyTo. We can do it by setting state or letting MapView handle it.
      useStore.getState().setEarthquakeEpicenter({ lat, lng });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMlSimulationData(null);
    setMlHeatmapVisible(false);
    setMlContoursVisible(false);
    setError(null);
  };

  return (
    <div className="space-y-3">
      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="font-semibold text-slate-300 text-xs mb-1">Latitude</div>
          <input type="number" step="0.0001" value={lat} onChange={e => setLat(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 text-cyan-400 text-sm rounded px-2 py-1" />
        </div>
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="font-semibold text-slate-300 text-xs mb-1">Longitude</div>
          <input type="number" step="0.0001" value={lng} onChange={e => setLng(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 text-cyan-400 text-sm rounded px-2 py-1" />
        </div>
      </div>

      {/* Magnitude & Depth */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="font-semibold text-slate-300 text-xs mb-1">Magnitude</div>
          <input type="number" step="0.1" value={magnitude} onChange={e => setMagnitude(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 text-red-400 font-bold text-sm rounded px-2 py-1" />
        </div>
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="font-semibold text-slate-300 text-xs mb-1">Depth (km)</div>
          <input type="number" step="0.1" value={depth} onChange={e => setDepth(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 text-cyan-400 text-sm rounded px-2 py-1" />
        </div>
      </div>

      {/* Radius */}
      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-slate-300 text-xs">Radius Covered (km)</span>
          <span className="text-xs text-emerald-400">{radiusKm}</span>
        </div>
        <input type="range" min="10" max="1000" step="10" value={radiusKm} onChange={e => setRadiusKm(parseInt(e.target.value))} className="w-full h-1 rounded-lg appearance-none bg-slate-700 cursor-pointer accent-emerald-500" />
      </div>
      
      {error && (
        <div className="text-xs text-red-400 p-2 bg-red-900/20 border border-red-500/30 rounded">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 mt-3">
        <button onClick={handleClear} disabled={isLoading} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
          <RefreshCw size={14} /> Clear
        </button>
        <button onClick={handleSimulate} disabled={isLoading} className="flex-[2] flex justify-center items-center gap-2 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all bg-cyan-600/80 hover:bg-cyan-500 text-white border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Play size={14} /> {isLoading ? 'Running ML...' : 'Simulate'}
        </button>
      </div>

      {/* Toggles */}
      <div className="flex gap-2 mt-2">
        <button onClick={() => setMlHeatmapVisible(!mlHeatmapVisible)} className={`flex-1 flex justify-center items-center gap-1 px-2 py-2 rounded-lg font-bold text-[10px] uppercase transition-all border ${mlHeatmapVisible ? 'bg-orange-600/50 text-white border-orange-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
          <Layers size={14} /> Heatmap
        </button>
        <button onClick={() => setMlContoursVisible(!mlContoursVisible)} className={`flex-1 flex justify-center items-center gap-1 px-2 py-2 rounded-lg font-bold text-[10px] uppercase transition-all border ${mlContoursVisible ? 'bg-emerald-600/50 text-white border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
          <Layers size={14} /> Contours
        </button>
      </div>
    </div>
  );
}
