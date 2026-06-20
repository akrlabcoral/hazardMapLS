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
    isLiveRainfall,
    setIsLiveRainfall,
    targetDateOffset,
    setTargetDateOffset,
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
      isLiveRainfall: s.isLiveRainfall,
      setIsLiveRainfall: s.setIsLiveRainfall,
      targetDateOffset: s.targetDateOffset,
      setTargetDateOffset: s.setTargetDateOffset,
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
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-slate-400 uppercase">Rainfall Parameters</label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">Live API Data</span>
              <button
                onClick={() => setIsLiveRainfall(!isLiveRainfall)}
                className={`w-8 h-4 rounded-full transition-colors relative ${isLiveRainfall ? 'bg-blue-500' : 'bg-slate-600'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${isLiveRainfall ? 'left-auto right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
          
          {isLiveRainfall ? (
            <div className="p-2 bg-blue-900/20 border border-blue-500/30 rounded space-y-3">
              <div className="text-center">
                <CloudRain className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <p className="text-[10px] text-blue-300 mb-2">Using live precipitation forecast from Open-Meteo.</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-[#f1f5f9]">Target Date</span>
                  <span className="text-[12px] text-[#00d4ff] font-mono">
                    {targetDateOffset === 0 ? "Today" : targetDateOffset < 0 ? `${Math.abs(targetDateOffset)} Days Ago` : `In ${targetDateOffset} Days`}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-3" max="3" step="1" 
                  value={targetDateOffset} 
                  onChange={(e) => setTargetDateOffset(parseInt(e.target.value))}
                  className="w-full accent-blue-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-[9px] text-[#64748b]">
                  <span>-3 Days</span>
                  <span>Today</span>
                  <span>+3 Days</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300">Intensity (mm/day)</span>
                <input 
                  type="number" 
                  value={rainfallIntensity}
                  onChange={(e) => setRainfallIntensity(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-right text-slate-200"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300">Duration (days)</span>
                <input 
                  type="number" 
                  value={rainfallDuration}
                  onChange={(e) => setRainfallDuration(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-right text-slate-200"
                />
              </div>
            </div>
          )}
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
