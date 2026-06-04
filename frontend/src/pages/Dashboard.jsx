import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MapView from '../components/MapView';
import MapLegend from '../components/MapLegend';
import StatusCard from '../components/StatusCard';
import ControlPanel from '../components/ControlPanel';
import { ShieldAlert, Crosshair, RefreshCw, Eye, EyeOff, Building2, Play, Activity } from 'lucide-react';
import useStore from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import UploadProgressManager from '../components/UploadProgressManager';
import { useSimulation } from '../hooks/useSimulation';
import StateHoverTooltip from '../components/StateHoverTooltip';
import StateAnalysisPanel from '../components/StateAnalysisPanel';
import { AlertsPanel } from '../panels/AlertsPanel';

const RasterLayersPanel = React.lazy(() => import('../components/RasterLayersPanel'));
const MLSimulationPanel = React.lazy(() => import('../components/MLSimulationPanel'));

export default function Dashboard() {
  const isSidebarOpen = useStore((state) => state.isSidebarOpen);
  const activeSection = useStore((state) => state.activeSection);
  const sidebarWidth = useStore((state) => state.sidebarWidth);
  const isDraggingSidebar = useStore((state) => state.isDraggingSidebar);
  
  const clearLiveEarthquakes = useStore((state) => state.clearLiveEarthquakes);
  const clearSimulationState = useStore((state) => state.clearSimulationState);

  // ── Simulation trigger (FastAPI REST) ───────────────────────────────────────
  const { handleRunSimulation } = useSimulation();

  const handleClearMap = () => {
    clearSimulationState();
  };

  // ── Layer & Raster State (used by control panels below) ───────────────────────
  const gisLayers        = useStore((state) => state.gisLayers);
  const layerOpacities   = useStore((state) => state.layerOpacities);
  const setLayerOpacity  = useStore((state) => state.setLayerOpacity);

  return (
    <div className="relative w-full h-full flex flex-col">
      <Navbar />
      
      <div className="flex-1 relative flex overflow-hidden">
        <Sidebar />
        <MapView />
        <MapLegend />
        <StateHoverTooltip />
        <StateAnalysisPanel />
        <UploadProgressManager />

        {/* Main Content Overlay */}
        <motion.div 
          className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6"
          initial={{ left: 0 }}
          animate={{ left: isSidebarOpen ? 280 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >


          {/* Bottom Control Panels */}
          <div className="mt-auto flex gap-4 pointer-events-none items-end [&>*]:pointer-events-auto">
            <AnimatePresence mode="wait">
              {activeSection && (
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-[480px]"
                >
                  <ControlPanel title={activeSection.toUpperCase() + ' PANEL'}>
                  {activeSection === 'alerts' && (
                    <AlertsPanel />
                  )}

                  {activeSection === 'layers' && (
                    <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                      {/* Raster Data Panel */}
                      <React.Suspense fallback={<div className="p-4 text-sm text-slate-400 italic">Loading Raster Data...</div>}>
                        <RasterLayersPanel />
                      </React.Suspense>
                      
                      {/* Base Layers */}
                      <div>
                        <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Base Layers</div>
                        {['satellite', 'terrain'].map((key) => (
                          <div key={key} className="p-3 mb-2 bg-[#0a0f1e]/50 rounded-lg border border-white/[0.06]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-[#f1f5f9] text-[13px] capitalize">{key}</span>
                              <label className="cursor-pointer relative inline-flex items-center">
                                <input type="checkbox" checked={gisLayers[key]} onChange={() => useStore.getState().toggleGisLayer(key)} className="sr-only peer" />
                                <div className="w-8 h-4 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00d4ff]"></div>
                              </label>
                            </div>
                            {gisLayers[key] && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="range" min="0" max="1" step="0.05"
                                  value={layerOpacities[key]}
                                  onChange={(e) => setLayerOpacity(key, parseFloat(e.target.value))}
                                  className="flex-1 accent-cyan-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-xs text-cyan-400 w-8 text-right">{Math.round(layerOpacities[key] * 100)}%</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Data Layers */}
                      <div>
                        <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Data Layers</div>
                        {['indiaBoundary', 'hospitals', 'roads', 'shelters', 'landslides'].map((key) => (
                          <div key={key} className="p-3 mb-2 bg-[#0a0f1e]/50 rounded-lg border border-white/[0.06]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-[#f1f5f9] text-[13px] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <label className="cursor-pointer relative inline-flex items-center">
                                <input type="checkbox" checked={gisLayers[key]} onChange={() => useStore.getState().toggleGisLayer(key)} className="sr-only peer" />
                                <div className="w-8 h-4 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00d4ff]"></div>
                              </label>
                            </div>
                            {gisLayers[key] && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="range" min="0" max="1" step="0.05"
                                  value={layerOpacities[key]}
                                  onChange={(e) => setLayerOpacity(key, parseFloat(e.target.value))}
                                  className="flex-1 accent-cyan-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-xs text-cyan-400 w-8 text-right">{Math.round(layerOpacities[key] * 100)}%</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === 'alerts' && (
                    <AlertsPanel />
                  )}
                </ControlPanel>
              </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
