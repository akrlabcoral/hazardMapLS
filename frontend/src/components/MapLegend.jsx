import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import useStore from '../store/useStore';

export default function MapLegend() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const activeModule = useStore((state) => state.activeModule);
  const gisLayers = useStore((state) => state.gisLayers);
  const simulationResults = useStore((state) => state.simulationResults);
  const earthquakeEpicenter = useStore((state) => state.earthquakeEpicenter);

  // Dynamically determine which legend sections to show
  const showEarthquakeBase = activeModule === 'earthquake' && earthquakeEpicenter !== null;
  const showEarthquakePGA = activeModule === 'earthquake' && simulationResults !== null;
  
  const showLandslideEvents = activeModule === 'landslide' && gisLayers.landslides;
  const showLandslideSoil = activeModule === 'landslide' && gisLayers.soilMoisture;
  const showLandslideDEM = activeModule === 'landslide' && gisLayers.slopeRisk;

  const hasAnyLegend = showEarthquakeBase || showEarthquakePGA || showLandslideEvents || showLandslideSoil || showLandslideDEM;

  // Completely hide the component if there is nothing to show
  if (!hasAnyLegend) return null;

  return (
    <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end pointer-events-auto">
      <motion.div
        className="glass-panel overflow-hidden w-64 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
        initial={false}
        animate={{ height: isCollapsed ? 40 : 'auto' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div 
          className="flex items-center justify-between px-4 h-10 cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-colors border-b border-white/[0.06]"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <h3 className="font-bold text-[#f1f5f9] uppercase tracking-wider text-[11px]">
            Map Legend
          </h3>
          {isCollapsed ? <ChevronUp className="w-4 h-4 text-[#64748b]" /> : <ChevronDown className="w-4 h-4 text-[#64748b]" />}
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 text-xs space-y-4"
            >
              {activeModule === 'earthquake' ? (
                <>
                  {showEarthquakeBase && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></div>
                        <span className="text-[#64748b]">Safe node</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-[#22c55e] rounded"></div>
                        <span className="text-[#64748b]">Evacuation route</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#dc2626] border border-white"></div>
                        <span className="text-[#64748b]">Epicenter</span>
                      </div>
                    </div>
                  )}

                  {showEarthquakePGA && (
                    <div className={showEarthquakeBase ? "pt-3 border-t border-white/[0.06]" : ""}>
                      <div className="text-[10px] text-[#64748b] uppercase tracking-wider mb-2">PGA Intensity (g)</div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#dc2626]"></div><span className="text-[#f1f5f9]">&gt; 0.20 (Severe)</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#f97316]"></div><span className="text-[#f1f5f9]">0.10 - 0.20 (Strong)</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#eab308]"></div><span className="text-[#f1f5f9]">0.05 - 0.10 (Moderate)</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#22c55e]"></div><span className="text-[#f1f5f9]">&lt; 0.05 (Light)</span></div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {showLandslideEvents && (
                    <div className="space-y-2">
                      <div className="text-[10px] text-[#64748b] uppercase tracking-wider mb-2">Historical Events (Severity)</div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#dc2626]"></div><span className="text-[#f1f5f9]">Very High</span></div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></div><span className="text-[#f1f5f9]">High</span></div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#eab308]"></div><span className="text-[#f1f5f9]">Moderate</span></div>
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></div><span className="text-[#f1f5f9]">Low</span></div>
                    </div>
                  )}
                  
                  {showLandslideDEM && (
                    <div className={showLandslideEvents ? "pt-3 border-t border-white/[0.06]" : ""}>
                      <div className="text-[10px] text-[#64748b] uppercase tracking-wider mb-2">Slope Risk (DEM)</div>
                      <div className="h-2 w-full rounded bg-gradient-to-r from-[#000000] to-[#ffffff] mb-1"></div>
                      <div className="flex justify-between text-[10px] text-[#64748b]">
                        <span>Low Elev</span>
                        <span>High Elev</span>
                      </div>
                    </div>
                  )}

                  {showLandslideSoil && (
                    <div className={(showLandslideEvents || showLandslideDEM) ? "pt-3 border-t border-white/[0.06]" : ""}>
                      <div className="text-[10px] text-[#64748b] uppercase tracking-wider mb-2">Soil Moisture (ERA5)</div>
                      <div className="h-2 w-full rounded bg-gradient-to-r from-[#ffffcc] via-[#41b6c4] to-[#253494] mb-1"></div>
                      <div className="flex justify-between text-[10px] text-[#64748b]">
                        <span>Dry (0.0)</span>
                        <span>Saturated (0.5+)</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
