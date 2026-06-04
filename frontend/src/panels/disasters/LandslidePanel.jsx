import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import useStore from '../../store/useStore';
import { useLandslideSimulation } from '../../hooks/useLandslideSimulation';
import { RefreshCw, Play, CloudRain, Activity, GitMerge } from 'lucide-react';
import { EpicenterControl } from './EpicenterControl';
import { MagnitudeDepthRow } from './MagnitudeDepthRow';
import { LandslideValidationPanel } from './LandslideValidationPanel';

export function LandslidePanel() {
  const { 
    landslideType, 
    setLandslideType,
    rainfallIntensity,
    setRainfallIntensity,
    rainfallDuration,
    setRainfallDuration,
    earthquakeEpicenter, 
    isSimulationRunning, 
    clearSimulationState 
  } = useStore(
    useShallow((s) => ({
      landslideType: s.landslideType,
      setLandslideType: s.setLandslideType,
      rainfallIntensity: s.rainfallIntensity,
      setRainfallIntensity: s.setRainfallIntensity,
      rainfallDuration: s.rainfallDuration,
      setRainfallDuration: s.setRainfallDuration,
      earthquakeEpicenter: s.earthquakeEpicenter,
      isSimulationRunning: s.isSimulationRunning,
      clearSimulationState: s.clearSimulationState,
    }))
  );

  const { handleRunSimulation } = useLandslideSimulation();

  return (
    <div className="space-y-4">
      {/* Simulation Type Selector */}
      <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
        <label className="text-xs font-semibold text-slate-400 uppercase mb-2 block">Trigger Type</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setLandslideType('rainfall')}
            className={`flex flex-col items-center justify-center p-2 rounded border transition-colors ${
              landslideType === 'rainfall' ? 'bg-blue-900/40 border-blue-500 text-blue-400' : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            <CloudRain size={20} className="mb-1" />
            <span className="text-[10px] font-bold">Rainfall</span>
          </button>
          <button
            onClick={() => setLandslideType('earthquake')}
            className={`flex flex-col items-center justify-center p-2 rounded border transition-colors ${
              landslideType === 'earthquake' ? 'bg-orange-900/40 border-orange-500 text-orange-400' : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Activity size={20} className="mb-1" />
            <span className="text-[10px] font-bold">Seismic</span>
          </button>
          <button
            onClick={() => setLandslideType('combined')}
            className={`flex flex-col items-center justify-center p-2 rounded border transition-colors ${
              landslideType === 'combined' ? 'bg-purple-900/40 border-purple-500 text-purple-400' : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            <GitMerge size={20} className="mb-1" />
            <span className="text-[10px] font-bold">Combined</span>
          </button>
        </div>
      </div>

      {/* Conditional Inputs based on trigger type */}
      {(landslideType === 'rainfall' || landslideType === 'combined') && (
        <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 space-y-3">
          <label className="text-xs font-semibold text-slate-400 uppercase block">Rainfall Parameters</label>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-300">Intensity (mm/day)</span>
              <input 
                type="number" 
                value={rainfallIntensity}
                onChange={(e) => setRainfallIntensity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-right text-slate-200"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-300">Duration (days)</span>
              <input 
                type="number" 
                value={rainfallDuration}
                onChange={(e) => setRainfallDuration(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-right text-slate-200"
              />
            </div>
          </div>
        </div>
      )}

      {(landslideType === 'earthquake' || landslideType === 'combined') && (
        <div className="space-y-3">
          <EpicenterControl />
          <MagnitudeDepthRow />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={clearSimulationState}
          className="flex-1 flex justify-center items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-500"
        >
          <RefreshCw size={16} />
          Clear
        </button>
        <button
          onClick={handleRunSimulation}
          disabled={isSimulationRunning || (landslideType !== 'rainfall' && !earthquakeEpicenter)}
          className={`flex-1 flex justify-center items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
            isSimulationRunning || (landslideType !== 'rainfall' && !earthquakeEpicenter)
              ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
              : 'bg-emerald-600/80 hover:bg-emerald-500 text-white border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]'
          }`}
        >
          <Play size={16} />
          {isSimulationRunning ? 'Running...' : 'Run Sim'}
        </button>
      </div>

      <LandslideValidationPanel />
    </div>
  );
}
