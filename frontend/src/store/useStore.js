import { create } from 'zustand';
import { BUILT_IN_RASTERS } from '../config/rasterRegistry';

const useStore = create((set) => ({
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
  earthquakeEpicenter: null, // { lng, lat }
  setEarthquakeEpicenter: (epicenter) => set({ earthquakeEpicenter: epicenter }),
  
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

  activeAlerts: [],
  
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

  // Centralized cleanup for simulation state
  clearSimulationState: () => set({
    earthquakeEpicenter: null,
    simulationResults: null,
    isSimulationRunning: false,
    mlSimulationData: null,
    mlHeatmapVisible: false,
    mlContoursVisible: false,
  }),
}));

export default useStore;
