import React from 'react';
import useStore from '../../store/useStore';
import { Layers, Activity, Droplets, Calendar, Filter, Mountain } from 'lucide-react';
import { LandslidePanel } from '../../panels/disasters/LandslidePanel';

export default function LandslideModule() {
  const gisLayers = useStore((state) => state.gisLayers);
  const toggleGisLayer = useStore((state) => state.toggleGisLayer);
  const activeSection = useStore((state) => state.activeSection);
  const setActiveSection = useStore((state) => state.setActiveSection);
  const rasterLoadingState = useStore((state) => state.rasterLoadingState);

  // Helper for rendering loading states
  const getLoader = (key) => {
    const s = rasterLoadingState[key];
    if (s === 'reading' || s === 'processing') {
      return <span className="ml-2 text-[10px] text-[#00d4ff] animate-pulse italic">(Loading...)</span>;
    }
    return null;
  };

  // Stats mock for now (could be pulled from store in future)
  const stats = { events: 142, deaths: 430, worst: 'Sikkim' };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header & Layers Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold tracking-wide text-[#f1f5f9] uppercase">Landslide Model</h2>
        <button 
          onClick={() => setActiveSection(activeSection === 'layers' ? null : 'layers')}
          className={`p-1.5 rounded transition-colors ${activeSection === 'layers' ? 'bg-[#00d4ff]/20 text-[#00d4ff]' : 'hover:bg-white/[0.05] text-[#64748b]'}`}
          title="Toggle Layers Panel"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {/* Core Layers */}
        <div className="p-3 bg-[#0a0f1e]/50 rounded-lg border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#f1f5f9] text-[13px]">
              <Activity className="w-4 h-4 text-[#dc2626]" />
              Historical Events
            </div>
            <label className="cursor-pointer relative inline-flex items-center">
              <input type="checkbox" checked={gisLayers.landslides} onChange={() => toggleGisLayer('landslides')} className="sr-only peer" />
              <div className="w-8 h-4 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00d4ff]"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#f1f5f9] text-[13px]">
              <Mountain className="w-4 h-4 text-[#f97316]" /> {/* wait Mountain not imported, replace with simple svg or drop icon */}
              <span className="w-4 h-4 text-[#f97316] text-center font-bold">△</span>
              Slope Risk (DEM) {getLoader('slopeRisk')}
            </div>
            <label className="cursor-pointer relative inline-flex items-center">
              <input type="checkbox" checked={gisLayers.slopeRisk} onChange={() => toggleGisLayer('slopeRisk')} className="sr-only peer" />
              <div className="w-8 h-4 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00d4ff]"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#f1f5f9] text-[13px]">
              <Droplets className="w-4 h-4 text-[#00d4ff]" />
              Soil Moisture {getLoader('soilMoisture')}
            </div>
            <label className="cursor-pointer relative inline-flex items-center">
              <input type="checkbox" checked={gisLayers.soilMoisture} onChange={() => toggleGisLayer('soilMoisture')} className="sr-only peer" />
              <div className="w-8 h-4 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00d4ff]"></div>
            </label>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 bg-[#0a0f1e]/50 rounded-lg border border-white/[0.06]">
          <div className="text-[11px] font-semibold text-[#64748b] uppercase mb-3 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters
          </div>
          
          <div className="mb-3">
            <span className="text-[10px] text-[#64748b] block mb-2">Severity Legend & Filters</span>
            <div className="flex flex-col gap-2 text-[11px] text-[#f1f5f9]">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="accent-[#00d4ff]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> Very High (&gt;0.8)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="accent-[#00d4ff]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#f97316]" /> High (0.6 - 0.8)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="accent-[#00d4ff]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#eab308]" /> Significant (0.4 - 0.6)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="accent-[#00d4ff]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" /> Moderate (0.2 - 0.4)
              </label>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-3">
            <span className="text-[10px] text-[#64748b] block mb-2 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date Range</span>
            <div className="flex items-center gap-2">
              <input type="number" defaultValue={2014} className="w-full bg-[#0d1526] border border-white/[0.1] text-[#f1f5f9] text-[12px] rounded px-2 py-1 focus:outline-none focus:border-[#00d4ff]" />
              <span className="text-[#64748b]">-</span>
              <input type="number" defaultValue={2024} className="w-full bg-[#0d1526] border border-white/[0.1] text-[#f1f5f9] text-[12px] rounded px-2 py-1 focus:outline-none focus:border-[#00d4ff]" />
            </div>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <LandslidePanel />
        </div>
      </div>
    </div>
  );
}
