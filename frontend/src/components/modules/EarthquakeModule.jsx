import React from 'react';
import useStore from '../../store/useStore';
import { useSimulation } from '../../hooks/useSimulation';
import { RefreshCw, Play, Layers } from 'lucide-react';

export default function EarthquakeModule() {
  const earthquakeEpicenter = useStore((state) => state.earthquakeEpicenter);
  const setEarthquakeEpicenter = useStore((state) => state.setEarthquakeEpicenter);
  const earthquakeMagnitude = useStore((state) => state.earthquakeMagnitude);
  const setEarthquakeMagnitude = useStore((state) => state.setEarthquakeMagnitude);
  const earthquakeDepth = useStore((state) => state.earthquakeDepth);
  const setEarthquakeDepth = useStore((state) => state.setEarthquakeDepth);
  const gmpeModel = useStore((state) => state.gmpeModel);
  const setGmpeModel = useStore((state) => state.setGmpeModel);
  const showAmplifiedPga = useStore((state) => state.showAmplifiedPga);
  const setShowAmplifiedPga = useStore((state) => state.setShowAmplifiedPga);
  const simulationResults = useStore((state) => state.simulationResults);
  const isSimulationRunning = useStore((state) => state.isSimulationRunning);
  const clearSimulationState = useStore((state) => state.clearSimulationState);
  const setActiveSection = useStore((state) => state.setActiveSection);
  const activeSection = useStore((state) => state.activeSection);

  const { handleRunSimulation } = useSimulation();

  const formatCoords = (coords) => {
    if (!coords) return 'Not Set';
    return `${Math.abs(coords.lat).toFixed(2)}°${coords.lat >= 0 ? 'N' : 'S'}, ${Math.abs(coords.lng).toFixed(2)}°${coords.lng >= 0 ? 'E' : 'W'}`;
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header & Layers Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold tracking-wide text-[#f1f5f9] uppercase">Earthquake Engine</h2>
        <button 
          onClick={() => setActiveSection(activeSection === 'layers' ? null : 'layers')}
          className={`p-1.5 rounded transition-colors ${activeSection === 'layers' ? 'bg-[#00d4ff]/20 text-[#00d4ff]' : 'hover:bg-white/[0.05] text-[#64748b]'}`}
          title="Toggle Layers Panel"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {/* Epicenter */}
        <div className="p-3 bg-[#0a0f1e]/50 rounded-lg border border-white/[0.06]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-semibold text-[#64748b] uppercase">Epicenter</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${earthquakeEpicenter ? 'bg-[#dc2626]/20 text-[#dc2626] border-[#dc2626]/30' : 'bg-transparent text-[#64748b] border-white/[0.1]'}`}>
              {earthquakeEpicenter ? 'LOCKED' : 'WAITING'}
            </span>
          </div>
          <div className="text-[13px] font-mono text-[#00d4ff] mt-1 mb-2">
            {formatCoords(earthquakeEpicenter)}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-[#64748b] block mb-1">Lat</label>
              <input
                type="number" step="0.0001"
                value={earthquakeEpicenter ? earthquakeEpicenter.lat : ''}
                onChange={(e) => setEarthquakeEpicenter({ lat: parseFloat(e.target.value) || 0, lng: earthquakeEpicenter ? earthquakeEpicenter.lng : 88.3639 })}
                className="w-full bg-[#0d1526] border border-white/[0.1] text-[#00d4ff] text-[13px] rounded px-2 py-1.5 focus:outline-none focus:border-[#00d4ff]"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-[#64748b] block mb-1">Lng</label>
              <input
                type="number" step="0.0001"
                value={earthquakeEpicenter ? earthquakeEpicenter.lng : ''}
                onChange={(e) => setEarthquakeEpicenter({ lat: earthquakeEpicenter ? earthquakeEpicenter.lat : 22.5726, lng: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#0d1526] border border-white/[0.1] text-[#00d4ff] text-[13px] rounded px-2 py-1.5 focus:outline-none focus:border-[#00d4ff]"
              />
            </div>
          </div>
        </div>

        {/* Magnitude */}
        <div className="p-3 bg-[#0a0f1e]/50 rounded-lg border border-white/[0.06]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold text-[#64748b] uppercase">Magnitude</span>
            <span className="text-[15px] font-bold text-[#dc2626]">{earthquakeMagnitude.toFixed(1)}</span>
          </div>
          <input 
            type="number" 
            min="1.0" max="10.0" step="0.1" 
            value={earthquakeMagnitude}
            onChange={(e) => setEarthquakeMagnitude(parseFloat(e.target.value) || 1.0)}
            className="w-full bg-[#0d1526] border border-white/[0.1] text-[#dc2626] font-bold text-[13px] rounded px-2 py-1.5 focus:outline-none focus:border-[#dc2626]"
          />
        </div>

        {/* Depth */}
        <div className="p-3 bg-[#0a0f1e]/50 rounded-lg border border-white/[0.06]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold text-[#64748b] uppercase">Depth</span>
            <span className="text-[13px] font-bold text-[#00d4ff]">{earthquakeDepth} km</span>
          </div>
          <input 
            type="number" 
            min="1" max="100" step="0.1" 
            value={earthquakeDepth}
            onChange={(e) => setEarthquakeDepth(parseFloat(e.target.value) || 1)}
            className="w-full bg-[#0d1526] border border-white/[0.1] text-[#00d4ff] font-bold text-[13px] rounded px-2 py-1.5 focus:outline-none focus:border-[#00d4ff]"
          />
        </div>

        {/* Scientific Model */}
        <div className="p-3 bg-[#0a0f1e]/50 rounded-lg border border-white/[0.06]">
          <div className="text-[11px] font-semibold text-[#64748b] uppercase mb-2">Scientific Model</div>
          <select 
            value={gmpeModel}
            onChange={(e) => setGmpeModel(e.target.value)}
            className="w-full bg-[#0d1526] border border-white/[0.1] text-[#f1f5f9] text-[13px] rounded px-2 py-1.5 focus:outline-none focus:border-[#00d4ff] mb-3"
          >
            <option value="indian_shield">Indian Shield</option>
            <option value="himalayan">Himalayan</option>
            <option value="continental">Stable Continental</option>
          </select>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
            <span className="text-[11px] text-[#64748b]">Soil Amplification</span>
            <label className="cursor-pointer relative inline-flex items-center">
              <input 
                type="checkbox" 
                checked={showAmplifiedPga} 
                onChange={() => setShowAmplifiedPga(!showAmplifiedPga)} 
                className="sr-only peer" 
              />
              <div className="w-8 h-4 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00d4ff]"></div>
            </label>
          </div>
        </div>

        {/* Summary */}
        {simulationResults && simulationResults.district_summary && (
          <div className="p-3 bg-[#0a0f1e]/50 rounded-lg border border-white/[0.06]">
            <div className="text-[11px] font-semibold text-[#64748b] uppercase mb-2 flex justify-between">
              <span>Impact Summary</span>
            </div>
            <div className="max-h-32 overflow-y-auto pr-1 space-y-1.5">
              {simulationResults.district_summary.sort((a,b) => b.max_pga - a.max_pga).slice(0, 5).map(d => (
                <div key={d.district} className="flex justify-between items-center text-[11px]">
                  <span className="text-[#f1f5f9] font-medium truncate w-1/2">{d.district}</span>
                  <span className="text-[#dc2626] font-mono">{d.max_pga.toFixed(2)}g</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons (Fixed at bottom) */}
      <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
        <button
          onClick={() => clearSimulationState()}
          className="p-3 rounded-lg text-[#64748b] hover:text-[#f1f5f9] hover:bg-white/[0.05] transition-colors border border-white/[0.1]"
          title="Reset Map"
        >
          <RefreshCw size={16} />
        </button>
        <button
          onClick={handleRunSimulation}
          disabled={!earthquakeEpicenter || isSimulationRunning}
          className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-lg font-bold text-[13px] uppercase tracking-wider transition-all duration-200 ${
            !earthquakeEpicenter || isSimulationRunning
              ? 'bg-white/[0.05] text-[#64748b] cursor-not-allowed'
              : 'bg-[#00d4ff] hover:bg-[#00b8d9] text-[#0a0f1e] shadow-[0_0_15px_rgba(0,212,255,0.3)]'
          }`}
        >
          <Play size={16} />
          {isSimulationRunning ? 'Running...' : 'Run Sim'}
        </button>
      </div>
    </div>
  );
}
