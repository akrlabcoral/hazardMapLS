import { create } from 'zustand';
import { BUILT_IN_RASTERS } from '../config/rasterRegistry';
import { HAZARD_LAYERS } from '../services/layerCapabilities';

const useStore = create((set, get) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  sidebarWidth: 288,
  isDraggingSidebar: false,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setIsDraggingSidebar: (isDragging) => set({ isDraggingSidebar: isDragging }),
  
  activeModule: 'earthquake', // 'earthquake' or 'landslide'
  setActiveModule: (module) => set({ activeModule: module }),
  
  activeSection: null,
  setActiveSection: (section) => set((state) => ({ activeSection: state.activeSection === section ? null : section })),

  mapStyle: 'dark',
  toggleMapStyle: () => set((state) => ({ mapStyle: state.mapStyle === 'dark' ? 'light' : 'dark' })),

  // Earthquake Simulation State
  isPlacingEpicenter: false,
  setIsPlacingEpicenter: (val) => set({ isPlacingEpicenter: val }),
  
  earthquakeEpicenter: null, // { lng, lat }
  setEarthquakeEpicenter: (epicenter) => set({ earthquakeEpicenter: epicenter }),
  
  epicenterRegion: null,
  setEpicenterRegion: (region) => set({ epicenterRegion: region }),
  
  earthquakeMagnitude: 5.0,
  setEarthquakeMagnitude: (magnitude) => set({ earthquakeMagnitude: magnitude }),
  
  earthquakeDepth: 10, // km, range 1-100
  setEarthquakeDepth: (depth) => set({ earthquakeDepth: depth }),
  
  gmpeModel: 'indian_shield',
  setGmpeModel: (model) => set({ gmpeModel: model }),
  
  showAmplifiedPga: true,
  setShowAmplifiedPga: (val) => set({ showAmplifiedPga: val }),
  
  // Simulation results from engine
  simulationResults: null,
  setSimulationResults: (results) => set({ simulationResults: results }),
  
  isSimulationRunning: false,
  setIsSimulationRunning: (val) => set({ isSimulationRunning: val }),

  activeAlert: null,
  
  gisLayers: {
    satellite: false,
    terrain: false,
    indiaBoundary: true,
    hospitals: false,
    shelters: false,
    heatmaps: false,
    dangerZones: false,
    safeZones: false,
    roads: false,
    landslides: false,
    slopeRisk: false,
    soilMoisture: false,
  },
  
  heatwaveActiveLayer: 'status', // 'status', 'temperature', 'anomaly'
  setHeatwaveActiveLayer: (layer) => set({ heatwaveActiveLayer: layer }),

  toggleGisLayer: (layer) => set((state) => ({
    gisLayers: { ...state.gisLayers, [layer]: !state.gisLayers[layer] }
  })),

  // Per-layer opacity (0-1)
  layerOpacities: {
    satellite: 1.0,
    terrain: 1.0,
    indiaBoundary: 1.0,
    hospitals: 1.0,
    shelters: 1.0,
    heatmaps: 1.0,
    dangerZones: 1.0,
    safeZones: 1.0,
    roads: 1.0,
    landslides: 1.0,
    slopeRisk: 0.8,
    soilMoisture: 0.8,
  },
  setLayerOpacity: (layer, opacity) => set((state) => ({
    layerOpacities: { ...state.layerOpacities, [layer]: opacity }
  })),

  // Dynamic Raster Layers State
  rasterLayers: [...BUILT_IN_RASTERS],
  rasterLoadingState: {}, // Tracks loading status of dynamic rasters e.g. { 'slopeRisk': 'processing' }
  setRasterLoadingState: (key, status) => set((state) => ({
    rasterLoadingState: { ...state.rasterLoadingState, [key]: status === 'completed' || status === 'failed' ? null : status }
  })),
  addRasterLayer: (layer) => set((state) => ({ rasterLayers: [...state.rasterLayers, layer] })),
  updateRasterLayerLoaded: (id, isLoaded) => set((state) => ({
    rasterLayers: state.rasterLayers.map(l => l.id === id ? { ...l, isLoaded } : l)
  })),
  removeRasterLayer: (id) => set((state) => ({ 
    rasterLayers: state.rasterLayers.filter(l => l.id !== id) 
  })),
  updateRasterLayerOpacity: (id, opacity) => set((state) => ({
    rasterLayers: state.rasterLayers.map(l => l.id === id ? { ...l, opacity } : l)
  })),
  updateRasterLayerVisibility: (id, visible) => set((state) => ({
    rasterLayers: state.rasterLayers.map(l => l.id === id ? { ...l, visible } : l)
  })),

  // File Upload Queue State
  uploadQueue: [], // { id, fileName, loadedBytes, totalBytes, status, error, abortController }
  addUploadTask: (task) => set((state) => ({ uploadQueue: [...state.uploadQueue, task] })),
  updateUploadTask: (id, updates) => set((state) => ({
    uploadQueue: state.uploadQueue.map(t => t.id === id ? { ...t, ...updates } : t)
  })),
  removeUploadTask: (id) => set((state) => ({
    uploadQueue: state.uploadQueue.filter(t => t.id !== id)
  })),
  
  mapViewport: {
    longitude: 88.36,
    latitude: 22.57,
    zoom: 8
  },
  setMapViewport: (viewport) => set({ mapViewport: viewport }),

  // ── ML Simulation State ────────────────────────────────────────────────────
  mlSimulationData: null,
  setMlSimulationData: (data) => set({ mlSimulationData: data }),
  mlHeatmapVisible: false,
  setMlHeatmapVisible: (visible) => set({ mlHeatmapVisible: visible }),
  mlContoursVisible: false,
  setMlContoursVisible: (visible) => set({ mlContoursVisible: visible }),
  mapClearToken: 0,

  currentSimAbortController: null,
  setCurrentSimAbortController: (ctrl) => set({ currentSimAbortController: ctrl }),

  // Centralized cleanup for simulation state
  clearSimulationState: () => {
    const state = get();
    if (state.currentSimAbortController) {
      state.currentSimAbortController.abort();
    }
    
    set({
      earthquakeEpicenter: null,
      simulationResults: null,
      isSimulationRunning: false,
      mlSimulationData: null,
      mlHeatmapVisible: false,
      mlContoursVisible: false,
      historicalValidationVisible: false,
      currentSimAbortController: null,
      mapClearToken: state.mapClearToken + 1,
    });
  },

  // ── Landslide Simulation State ─────────────────────────────────────────────
  landslideType: 'rainfall', // 'rainfall', 'earthquake', 'combined'
  setLandslideType: (type) => set({ landslideType: type }),
  
  rainfallIntensity: 50.0,
  setRainfallIntensity: (val) => set({ rainfallIntensity: val }),
  
  rainfallDuration: 3.0,
  setRainfallDuration: (val) => set({ rainfallDuration: val }),
  
  isLiveRainfall: false,
  setIsLiveRainfall: (val) => set({ isLiveRainfall: val }),
  
  targetDateOffset: 0,
  setTargetDateOffset: (val) => set({ targetDateOffset: val }),
  
  historicalValidationVisible: false,
  setHistoricalValidationVisible: (val) => set({ historicalValidationVisible: val }),

  // ── Heatwave Simulation State ──────────────────────────────────────────────
  heatwaveTemperature: 45.0,
  setHeatwaveTemperature: (val) => set({ heatwaveTemperature: val }),
  
  heatwaveHumidity: 40.0,
  setHeatwaveHumidity: (val) => set({ heatwaveHumidity: val }),

  heatwaveDuration: 3,
  setHeatwaveDuration: (val) => set({ heatwaveDuration: val }),

  // Advanced GMPE Parameters
  useCustomGmpe: false,
  setUseCustomGmpe: (val) => set({ useCustomGmpe: val }),
  gmpeParams: {
    c1: 1.35,
    c2: 0.5,
    c3: 0.0,
    c4: -0.005,
    C: 1.0
  },
  updateGmpeParam: (key, value) => set((state) => ({
    gmpeParams: { ...state.gmpeParams, [key]: value }
  })),
  
  // Modular Hazard Layers state
  hazardLayers: HAZARD_LAYERS.reduce((acc, layer) => {
    acc[layer.id] = { active: layer.available, weight: layer.defaultWeight };
    return acc;
  }, {}),
  toggleHazardLayer: (id) => set((state) => ({
    hazardLayers: {
      ...state.hazardLayers,
      [id]: { ...state.hazardLayers[id], active: !state.hazardLayers[id].active }
    }
  })),
  setHazardLayerWeight: (id, weight) => set((state) => ({
    hazardLayers: {
      ...state.hazardLayers,
      [id]: { ...state.hazardLayers[id], weight }
    }
  })),

  // State Analysis UI
  isHoverTooltipEnabled: false,
  setHoverTooltipEnabled: (val) => set({ isHoverTooltipEnabled: val }),
  
  hoveredStateId: null,
  setHoveredStateId: (id) => set({ hoveredStateId: id }),
  
  selectedStateName: null,
  setSelectedStateName: (name) => set({ selectedStateName: name }),
  
  stateIdMapping: null,
  setStateIdMapping: (mapping) => set({ stateIdMapping: mapping }),
  
  mousePos: { x: 0, y: 0 },
  setMousePos: (pos) => set({ mousePos: pos }),

  // Soil Amplification overlay visibility
  soilAmpVisible: false,
  setSoilAmpVisible: (val) => set({ soilAmpVisible: val }),

  // ── Real-Time Live Events ─────────────────────────────────────────
  liveEvents: [],
  addLiveEvent: (event) => set((s) => ({
    liveEvents: [event, ...s.liveEvents].slice(0, 50),
  })),
  clearLiveEvents: () => set({ liveEvents: [] }),

  // Alert banner
  activeAlert: null,
  setActiveAlert: (event) => set({ activeAlert: event }),
  dismissAlert: () => set({ activeAlert: null }),

  // WebSocket connection status
  wsConnected: false,
  setWsConnected: (val) => set({ wsConnected: val }),

  // Auto-simulation toggle
  autoSimEnabled: true,
  setAutoSimEnabled: (val) => set({ autoSimEnabled: val }),
}));

export default useStore;
