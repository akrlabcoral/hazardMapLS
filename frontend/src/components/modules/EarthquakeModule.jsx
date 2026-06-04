import React from 'react';
import useStore from '../../store/useStore';
import { Layers } from 'lucide-react';
import { DisastersPanel } from '../../panels/DisastersPanel';
import { useWebSocket } from '../../hooks/useWebSocket';
import AlertBanner from '../AlertBanner';

export default function EarthquakeModule() {
  const activeSection = useStore((state) => state.activeSection);
  const setActiveSection = useStore((state) => state.setActiveSection);

  // Start WebSocket connection for real-time earthquake events + auto-sim results
  useWebSocket();

  return (
    <div className="flex flex-col h-full space-y-4 relative">
      <AlertBanner />
      
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
        <DisastersPanel />
      </div>
    </div>
  );
}
