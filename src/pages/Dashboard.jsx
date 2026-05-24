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
const RasterLayersPanel = React.lazy(() => import('../components/RasterLayersPanel'));
import UploadProgressManager from '../components/UploadProgressManager';
import { useSocket }     from '../hooks/useSocket';
import { useSimulation } from '../hooks/useSimulation';
import { liveFeedService } from '../services/liveFeedService';
const MLSimulationPanel = React.lazy(() => import('../components/MLSimulationPanel'));

export default function Dashboard() {
  const isSidebarOpen = useStore((state) => state.isSidebarOpen);
  const activeSection = useStore((state) => state.activeSection);
  const sidebarWidth = useStore((state) => state.sidebarWidth);
  const isDraggingSidebar = useStore((state) => state.isDraggingSidebar);
  
  const earthquakeEpicenter = useStore((state) => state.earthquakeEpicenter);
  const setEarthquakeEpicenter = useStore((state) => state.setEarthquakeEpicenter);
  const earthquakeMagnitude = useStore((state) => state.earthquakeMagnitude);
  const setEarthquakeMagnitude = useStore((state) => state.setEarthquakeMagnitude);
  const earthquakeDepth = useStore((state) => state.earthquakeDepth);
  const setEarthquakeDepth = useStore((state) => state.setEarthquakeDepth);
  const simulationResults = useStore((state) => state.simulationResults);
  const isSimulationRunning = useStore((state) => state.isSimulationRunning);
  const setSimulationResults = useStore((state) => state.setSimulationResults);
  const clearLiveEarthquakes = useStore((state) => state.clearLiveEarthquakes);

  // ── Live Feed State ─────────────────────────────────────────────────────────
  const isFeedActive = useStore((state) => state.isFeedActive);
  const setFeedActive = useStore((state) => state.setFeedActive);
  const processedPointsCount = useStore((state) => state.processedPointsCount);
  const liveEarthquakes = useStore((state) => state.liveEarthquakes);
  const lastDetectedEarthquake = useStore((state) => state.lastDetectedEarthquake);
  const [feedIntervalMs, setFeedIntervalMs] = useState(2000);

  // ── Real-time WebSocket connection ──────────────────────────────────────────
  // Persists for the Dashboard lifetime. Inbound SIMULATION_RESULT events are
  // handled inside useSocket and pushed directly to the store — no re-render
  // cascade through Dashboard props.
  const { send } = useSocket();

  // ── Simulation trigger (WS-first, local fallback) ───────────────────────────
  const { handleRunSimulation } = useSimulation(send);

  // ── Live Feed Toggle ────────────────────────────────────────────────────────
  const handleToggleFeed = () => {
    if (isFeedActive) {
      liveFeedService.stopStream();
      setFeedActive(false);
    } else {
      useStore.getState().clearLiveEarthquakes();
      liveFeedService.startStream(feedIntervalMs);
      setFeedActive(true);
    }
  };

  const handleClearMap = () => {
    if (isFeedActive) {
      handleToggleFeed();
    }
    clearLiveEarthquakes();
    setSimulationResults(null);
    setEarthquakeEpicenter(null);
    useStore.getState().setIsSimulationRunning(false);
    useStore.getState().setMlSimulationData(null);
    useStore.getState().setMlHeatmapVisible(false);
    useStore.getState().setMlContoursVisible(false);
  };

  // ── Layer & Raster State (used by control panels below) ───────────────────────
  const gisLayers        = useStore((state) => state.gisLayers);
  const layerOpacities   = useStore((state) => state.layerOpacities);
  const setLayerOpacity  = useStore((state) => state.setLayerOpacity);

  // Dynamic raster layer state is managed directly inside RasterLayersPanel
  const formatCoords = (coords) => {
    if (!coords) return 'Not Set';
    return `${Math.abs(coords.lat).toFixed(2)}°${coords.lat >= 0 ? 'N' : 'S'}, ${Math.abs(coords.lng).toFixed(2)}°${coords.lng >= 0 ? 'E' : 'W'}`;
  };

  const stats = simulationResults?.stats;

  return (
    <div className="relative w-full h-full flex flex-col">
      <Navbar />
      
      <div className="flex-1 relative flex overflow-hidden">
        <Sidebar />
        <MapView />
        <MapLegend />
        <UploadProgressManager />

        {/* Main Content Overlay */}
        <motion.div 
          className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6"
          initial={{ left: 0 }}
          animate={{ left: isSidebarOpen ? sidebarWidth : 0 }}
          transition={isDraggingSidebar ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
        >


          {/* Bottom Control Panels */}
          <div className="mt-auto flex gap-4 pointer-events-none items-end [&>*]:pointer-events-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-[480px]"
              >
                <ControlPanel title={activeSection.toUpperCase() + ' PANEL'}>
                  {activeSection === 'disasters' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-slate-300">Earthquake Epicenter</span>
                          <span className={`text-xs px-2 py-1 rounded border ${earthquakeEpicenter ? 'bg-red-900/30 text-red-400 border-red-500/30' : 'bg-slate-900 text-slate-500 border-slate-700'}`}>
                            {earthquakeEpicenter ? 'ACTIVE' : 'WAITING'}
                          </span>
                        </div>
                        <div className="text-sm font-mono text-cyan-400 mt-1">
                          {formatCoords(earthquakeEpicenter)}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <div className="flex-1">
                            <label className="text-xs text-slate-500 block mb-1">Latitude</label>
                            <input
                              type="number" step="0.0001"
                              value={earthquakeEpicenter ? earthquakeEpicenter.lat : ''}
                              onChange={(e) => setEarthquakeEpicenter({ lat: parseFloat(e.target.value) || 0, lng: earthquakeEpicenter ? earthquakeEpicenter.lng : 88.3639 })}
                              className="w-full bg-slate-900 border border-slate-700 text-cyan-400 text-sm rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                              placeholder="e.g. 22.5726"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-slate-500 block mb-1">Longitude</label>
                            <input
                              type="number" step="0.0001"
                              value={earthquakeEpicenter ? earthquakeEpicenter.lng : ''}
                              onChange={(e) => setEarthquakeEpicenter({ lat: earthquakeEpicenter ? earthquakeEpicenter.lat : 22.5726, lng: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-slate-900 border border-slate-700 text-cyan-400 text-sm rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                              placeholder="e.g. 88.3639"
                            />
                          </div>
                        </div>
                        {!earthquakeEpicenter && (
                          <div className="text-xs text-slate-500 mt-2 italic">
                            Click anywhere on the map to set the epicenter.
                          </div>
                        )}
                      </div>

                      {/* Magnitude Slider */}
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-semibold text-slate-300">Magnitude</span>
                          <span className="text-lg font-bold neon-text-alert">{earthquakeMagnitude.toFixed(1)}</span>
                        </div>
                        <input 
                          type="number" 
                          min="1.0" max="10.0" step="0.1" 
                          value={earthquakeMagnitude}
                          onChange={(e) => {
                            let val = parseFloat(e.target.value);
                            setEarthquakeMagnitude(isNaN(val) ? 1.0 : val);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 text-red-400 font-bold text-lg rounded px-3 py-2 focus:outline-none focus:border-red-500"
                        />
                      </div>

                      {/* Depth Slider */}
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-semibold text-slate-300">Depth</span>
                          <span className="text-lg font-bold text-cyan-400">{earthquakeDepth} km</span>
                        </div>
                        <input 
                          type="number" 
                          min="1" max="100" step="0.1" 
                          value={earthquakeDepth}
                          onChange={(e) => {
                            let val = parseFloat(e.target.value);
                            setEarthquakeDepth(isNaN(val) ? 1 : val);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 text-cyan-400 font-bold text-lg rounded px-3 py-2 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={handleClearMap}
                          className="flex-1 flex justify-center items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-500"
                        >
                          <RefreshCw size={16} />
                          Clear Map
                        </button>

                        <button
                          onClick={handleRunSimulation}
                          disabled={!earthquakeEpicenter || isSimulationRunning}
                          className={`flex-1 flex justify-center items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
                            !earthquakeEpicenter || isSimulationRunning
                              ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                              : 'bg-red-600/80 hover:bg-red-500 text-white border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]'
                          }`}
                        >
                          <Play size={16} />
                          {isSimulationRunning ? 'Running...' : 'Run Sim'}
                        </button>
                      </div>

                      {/* Simulation summary if results exist */}
                      {stats && (
                        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Latest Simulation</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Severe Zone</span>
                              <span className="text-red-400 font-mono">{stats.radii.severe.toFixed(1)} km</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Moderate Zone</span>
                              <span className="text-orange-400 font-mono">{stats.radii.moderate.toFixed(1)} km</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Buildings Hit</span>
                              <span className="text-red-400 font-mono">{stats.buildings.destroyed + stats.buildings.majorDamage}/{stats.buildings.total}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Roads Blocked</span>
                              <span className="text-red-400 font-mono">{stats.roads.blocked}/{stats.roads.total}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSection === 'simulation' && (
                    <div className="space-y-3">


                      {/* ── Live Feed Controls ── */}
                      <div className="p-3 mt-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">Live Earthquake Monitor</div>
                        
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-slate-300">Poll Frequency (ms)</span>
                            <span className="text-sm font-bold text-emerald-400">{feedIntervalMs}</span>
                          </div>
                          <input 
                            type="range" 
                            min="500" max="10000" step="500" 
                            value={feedIntervalMs}
                            onChange={(e) => setFeedIntervalMs(parseInt(e.target.value))}
                            disabled={isFeedActive}
                            className={`w-full h-1 rounded-lg appearance-none ${isFeedActive ? 'bg-slate-700 cursor-not-allowed accent-slate-500' : 'bg-slate-700 cursor-pointer accent-emerald-500'}`}
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleClearMap}
                            className="flex-1 flex justify-center items-center gap-2 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                          >
                            <RefreshCw size={14} /> Clear
                          </button>
                          <button
                            onClick={handleToggleFeed}
                            className={`flex-[2] flex justify-center items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                              isFeedActive
                                ? 'bg-slate-800 hover:bg-slate-700 text-red-400 border border-red-500/50'
                                : 'bg-emerald-600/80 hover:bg-emerald-500 text-white border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            }`}
                          >
                            <Activity size={16} className={isFeedActive ? 'animate-pulse' : ''} />
                            {isFeedActive ? 'Stop' : 'Start'}
                          </button>
                        </div>
                      </div>

                      {/* Stats Summary */}
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Detection Status</div>
                        <div className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-700">
                          <span className="text-slate-400 text-sm">Total Detected</span>
                          <span className="text-cyan-400 font-bold text-lg">{processedPointsCount.toLocaleString()}</span>
                        </div>
                        {/* Last Detected Earthquake Info */}
                        {lastDetectedEarthquake ? (
                          <div className="mt-3 text-xs border-t border-slate-700/50 pt-2">
                            <div className="text-slate-500 mb-1">Latest Event</div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Mag:</span>
                                <span className="text-red-400 font-bold">{lastDetectedEarthquake.magnitude.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Depth:</span>
                                <span className="text-cyan-400">{lastDetectedEarthquake.depth} km</span>
                              </div>
                              <div className="col-span-2 flex justify-between">
                                <span className="text-slate-500">Location:</span>
                                <span className="text-slate-300 font-mono">{formatCoords(lastDetectedEarthquake)}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-slate-500 italic text-center border-t border-slate-700/50 pt-2">
                            Waiting for events...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeSection === 'ml-simulation' && (
                    <React.Suspense fallback={<div className="p-4 text-sm text-slate-400 italic">Loading ML Panel...</div>}>
                      <MLSimulationPanel />
                    </React.Suspense>
                  )}

                  {activeSection === 'layers' && (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      {/* Raster Data Panel */}
                      <React.Suspense fallback={<div className="p-4 text-sm text-slate-400 italic">Loading Raster Data...</div>}>
                        <RasterLayersPanel />
                      </React.Suspense>
                      
                      {/* Base Layers — superimposable with opacity */}
                      <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Base Layers</div>
                        {['satellite', 'terrain'].map((key) => (
                          <div key={key} className="p-3 mb-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-slate-300 capitalize">{key}</span>
                              <label className="cursor-pointer">
                                <div className={`w-10 h-5 rounded-full p-1 flex transition-colors duration-300 ${gisLayers[key] ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                                  <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${gisLayers[key] ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                                <input type="checkbox" checked={gisLayers[key]} onChange={() => useStore.getState().toggleGisLayer(key)} className="hidden" />
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

                      {/* Data Layers — toggles with opacity */}
                      <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Data Layers</div>
                        {['hospitals', 'roads', 'shelters'].map((key) => (
                          <div key={key} className="p-3 mb-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-slate-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <label className="cursor-pointer">
                                <div className={`w-10 h-5 rounded-full p-1 flex transition-colors duration-300 ${gisLayers[key] ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                                  <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${gisLayers[key] ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                                <input type="checkbox" checked={gisLayers[key]} onChange={() => useStore.getState().toggleGisLayer(key)} className="hidden" />
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
                    <div className="h-full flex flex-col justify-center items-center text-slate-500 italic p-4 text-center">
                      <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
                      <p>No active severe alerts in your sector.</p>
                    </div>
                  )}
                </ControlPanel>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
