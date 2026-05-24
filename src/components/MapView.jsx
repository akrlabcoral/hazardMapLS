import React, { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import circle from '@turf/circle';
import { isolines } from '@turf/isolines';
import useStore from '../store/useStore';
import { mapLayerService } from '../services/mapLayerService';
import { rasterService } from '../services/rasterService';
import { simulationFeedService } from '../services/simulationFeedService';

// Layer IDs for simulation visualization
const SIM_LAYERS = {
  HAZARD_FILL: 'sim-hazard-fill',
  BUILDINGS_DAMAGED: 'sim-buildings-damaged',
  BUILDINGS_INTACT: 'sim-buildings-intact',
  ROADS_BLOCKED: 'sim-roads-blocked',
  ROADS_CLEAR: 'sim-roads-clear',
  SHOCKWAVE: 'sim-shockwave',
  EPICENTER: 'sim-epicenter',
};

export default function MapView() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const shockwaveAnimRef = useRef(null);
  const mapViewport = useStore((state) => state.mapViewport);
  
  const earthquakeEpicenter = useStore((state) => state.earthquakeEpicenter);
  const setEarthquakeEpicenter = useStore((state) => state.setEarthquakeEpicenter);
  
  const gisLayers = useStore((state) => state.gisLayers);
  const layerOpacities = useStore((state) => state.layerOpacities);
  
  // Raster state is now handled dynamically inside RasterLayersPanel and rasterService

  const simulationResults = useStore((state) => state.simulationResults);
  const isSimulationRunning = useStore((state) => state.isSimulationRunning);

  const liveEarthquakes = useStore((state) => state.liveEarthquakes);
  
  const mlSimulationData = useStore((state) => state.mlSimulationData);
  const mlHeatmapVisible = useStore((state) => state.mlHeatmapVisible);
  const mlContoursVisible = useStore((state) => state.mlContoursVisible);

  // Initialize simulation sources and layers on a loaded map
  const initSimulationLayers = useCallback((mapInstance) => {
    // --- Sources ---
    const emptyFC = { type: 'FeatureCollection', features: [] };

    mapInstance.addSource('sim-hazard-source', { type: 'geojson', data: emptyFC });
    mapInstance.addSource('sim-buildings-source', { type: 'geojson', data: emptyFC });
    mapInstance.addSource('sim-roads-source', { type: 'geojson', data: emptyFC });
    mapInstance.addSource('sim-shockwave-source', { type: 'geojson', data: emptyFC });
    mapInstance.addSource('sim-epicenter-source', { type: 'geojson', data: emptyFC });
    mapInstance.addSource('sim-live-feed-source', { type: 'geojson', data: emptyFC });
    mapInstance.addSource('sim-ml-heatmap-source', { type: 'geojson', data: emptyFC });
    mapInstance.addSource('sim-ml-contours-source', { type: 'geojson', data: emptyFC });

    // --- Hazard Zone Fill ---
    mapInstance.addLayer({
      id: SIM_LAYERS.HAZARD_FILL,
      type: 'heatmap',
      source: 'sim-hazard-source',
      maxzoom: 15,
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 1.0, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1.2, 15, 3.5],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0.0, 'rgba(0,0,255,0)',
          0.1, 'rgba(0,0,255,0.4)', // blue
          0.3, '#10b981', // green
          0.5, '#eab308', // yellow
          0.7, '#f97316', // orange
          0.9, '#ef4444'  // red
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 10, 15, 60],
        'heatmap-opacity': 0.855
      }
    });

    // --- Roads (clear) ---
    mapInstance.addLayer({
      id: SIM_LAYERS.ROADS_CLEAR,
      type: 'line',
      source: 'sim-roads-source',
      filter: ['==', ['get', 'blocked'], false],
      layout: {
        visibility: useStore.getState().gisLayers.roads ? 'visible' : 'none'
      },
      paint: {
        'line-color': '#22c55e',
        'line-width': 3,
        'line-opacity': 0.8
      }
    });

    // --- Roads (blocked) ---
    mapInstance.addLayer({
      id: SIM_LAYERS.ROADS_BLOCKED,
      type: 'line',
      source: 'sim-roads-source',
      filter: ['==', ['get', 'blocked'], true],
      paint: {
        'line-color': '#ef4444',
        'line-width': 5,
        'line-opacity': 0.9
      }
    });

    // --- Buildings (damaged) ---
    mapInstance.addLayer({
      id: SIM_LAYERS.BUILDINGS_DAMAGED,
      type: 'circle',
      source: 'sim-buildings-source',
      filter: ['!=', ['get', 'damageLevel'], 'intact'],
      paint: {
        'circle-radius': [
          'match', ['get', 'damageLevel'],
          'destroyed', 7,
          'major', 6,
          'minor', 5,
          4
        ],
        'circle-color': [
          'match', ['get', 'damageLevel'],
          'destroyed', '#ef4444',
          'major', '#f97316',
          'minor', '#eab308',
          '#22c55e'
        ],
        'circle-stroke-width': 1.5,
        'circle-stroke-color': [
          'match', ['get', 'damageLevel'],
          'destroyed', '#fff',
          'major', '#fff',
          'minor', '#fff',
          '#fff'
        ],
        'circle-opacity': 0.85
      }
    });

    // --- Buildings (intact / safe nodes) ---
    mapInstance.addLayer({
      id: SIM_LAYERS.BUILDINGS_INTACT,
      type: 'circle',
      source: 'sim-buildings-source',
      filter: ['==', ['get', 'damageLevel'], 'intact'],
      layout: {
        visibility: useStore.getState().gisLayers.shelters ? 'visible' : 'none'
      },
      paint: {
        'circle-radius': 5,
        'circle-color': '#22c55e',
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#fff',
        'circle-opacity': 0.85
      }
    });



    // --- Live Feed Heatmap --- Cinematic multi-color intensity gradient
    mapInstance.addLayer({
      id: 'sim-live-feed-heatmap',
      type: 'heatmap',
      source: 'sim-live-feed-source',
      maxzoom: 15,
      paint: {
        // Weight: maps currentIntensity (0 to 10) to heatmap intensity weight (0 to 1)
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'currentIntensity'], 0, 0, 10, 1],
        // Intensity: increases with zoom for detail preservation at higher zoom levels
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
        // Realistic intensity colors matching the standard scale
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0,    'rgba(0,0,255,0)',
          0.1,  'rgba(0,0,255,0.4)',      // Blue (Weak)
          0.3,  'rgba(0,255,0,0.6)',      // Green (Light)
          0.5,  'rgba(255,255,0,0.7)',    // Yellow (Mild)
          0.7,  'rgba(255,165,0,0.85)',   // Orange (Moderate)
          0.9,  'rgba(255,0,0,0.95)'      // Red (Severe)
        ],
        // Dynamic radius depending on zoom
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 8, 15, 50],
        'heatmap-opacity': 0.85
      }
    });

    // --- Shockwave (animated ring) ---
    mapInstance.addLayer({
      id: SIM_LAYERS.SHOCKWAVE,
      type: 'line',
      source: 'sim-shockwave-source',
      paint: {
        'line-color': '#ef4444',
        'line-width': 3,
        'line-opacity': 0.6
      }
    });

    // --- Epicenter atmospheric glow ring ---
    // Creates a larger, blurred, translucent circle behind the main epicenter marker
    // for a premium layered depth effect matching cinematic GIS aesthetics
    mapInstance.addLayer({
      id: 'sim-epicenter-glow',
      type: 'circle',
      source: 'sim-epicenter-source',
      paint: {
        'circle-radius': 22,
        'circle-color': 'rgba(239, 68, 68, 0.25)',
        'circle-blur': 0.8,
        'circle-stroke-width': 0
      }
    });

    // --- Epicenter outer pulse ring ---
    // Medium-sized ring with moderate blur for layered glow effect
    mapInstance.addLayer({
      id: 'sim-epicenter-ring',
      type: 'circle',
      source: 'sim-epicenter-source',
      paint: {
        'circle-radius': 14,
        'circle-color': 'rgba(239, 68, 68, 0.4)',
        'circle-blur': 0.4,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': 'rgba(255, 255, 255, 0.3)'
      }
    });

    // --- Epicenter marker (main solid circle) ---
    mapInstance.addLayer({
      id: SIM_LAYERS.EPICENTER,
      type: 'circle',
      source: 'sim-epicenter-source',
      paint: {
        'circle-radius': 8,
        'circle-color': '#ef4444',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff'
      }
    });

    // --- ML Heatmap Layer ---
    mapInstance.addLayer({
      id: 'sim-ml-heatmap-layer',
      type: 'heatmap',
      source: 'sim-ml-heatmap-source',
      maxzoom: 15,
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity_normalized'], 0, 0, 1.0, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1.2, 15, 3.5],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0.0, 'rgba(0,0,255,0)',
          0.1, 'rgba(0,0,255,0.4)', // blue
          0.3, '#10b981', // green
          0.5, '#eab308', // yellow
          0.7, '#f97316', // orange
          0.9, '#ef4444'  // red
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 10, 15, 60],
        'heatmap-opacity': 0.85
      }
    });

    // --- ML Contours Layer ---
    mapInstance.addLayer({
      id: 'sim-ml-contours-layer',
      type: 'line',
      source: 'sim-ml-contours-source',
      paint: {
        'line-color': [
          'interpolate', ['linear'], ['get', 'intensity'],
          0.1, '#06b6d4', // cyan
          0.3, '#10b981', // green
          0.5, '#eab308', // yellow
          0.7, '#f97316', // orange
          0.9, '#ef4444'  // red
        ],
        'line-width': 2,
        'line-opacity': 0.9,
        'line-dasharray': [2, 1]
      }
    });

  }, []);

  // Shockwave animation
  const playShockwave = useCallback((epicenter, maxRadiusKm) => {
    if (!map.current) return;
    const setIsSimulationRunning = useStore.getState().setIsSimulationRunning;
    setIsSimulationRunning(true);

    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Three concentric shockwave rings at staggered progress for depth effect
      // Each ring appears at a different phase, creating a ripple propagation illusion
      const rings = [
        { progress: progress, opacity: 0.6 * (1 - progress), width: 3 + progress * 4 },
        { progress: Math.max(0, progress - 0.15), opacity: 0.4 * (1 - Math.max(0, progress - 0.15)), width: 2 + Math.max(0, progress - 0.15) * 3 },
        { progress: Math.max(0, progress - 0.3), opacity: 0.25 * (1 - Math.max(0, progress - 0.3)), width: 1.5 + Math.max(0, progress - 0.3) * 2 },
      ].filter(r => r.progress > 0);

      const features = rings.map(r => {
        const currentRadius = Math.max(0.1, maxRadiusKm * r.progress);
        return circle(
          [epicenter.lng, epicenter.lat],
          currentRadius,
          { units: 'kilometers', steps: 64 }
        );
      });

      const source = map.current.getSource('sim-shockwave-source');
      if (source) {
        source.setData({ type: 'FeatureCollection', features });
        if (map.current.getLayer(SIM_LAYERS.SHOCKWAVE)) {
          // Use the primary ring's values for the layer paint
          const primary = rings[0];
          map.current.setPaintProperty(SIM_LAYERS.SHOCKWAVE, 'line-opacity', primary.opacity);
          map.current.setPaintProperty(SIM_LAYERS.SHOCKWAVE, 'line-width', primary.width);
        }
      }

      if (progress < 1) {
        shockwaveAnimRef.current = requestAnimationFrame(animate);
      } else {
        if (source) {
          source.setData({ type: 'FeatureCollection', features: [] });
        }
        setIsSimulationRunning(false);
      }
    };

    if (shockwaveAnimRef.current) cancelAnimationFrame(shockwaveAnimRef.current);
    shockwaveAnimRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-dark': {
            type: 'raster',
            tiles: [
              'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
          }
        },
        layers: [
          {
            id: 'osm-dark-layer',
            type: 'raster',
            source: 'osm-dark',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: [mapViewport.longitude, mapViewport.latitude],
      zoom: mapViewport.zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    map.current.on('click', (e) => {
      setEarthquakeEpicenter({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    });

    map.current.on('style.load', () => {
      initSimulationLayers(map.current);
      mapLayerService.initializeSourcesAndLayers(map.current, useStore.getState().gisLayers);
      rasterService.setMap(map.current);
    });

    return () => {
      if (shockwaveAnimRef.current) cancelAnimationFrame(shockwaveAnimRef.current);
    };
  }, [mapViewport, setEarthquakeEpicenter, initSimulationLayers]);

  // Sync GIS layer visibility
  useEffect(() => {
    if (!map.current || !mapLayerService.initialized) return;
    Object.entries(gisLayers).forEach(([key, isVisible]) => {
      mapLayerService.setLayerVisibility(key, isVisible);
    });

    // Sync simulation layers visibility (Safe nodes & Evacuation routes)
    if (map.current.getLayer(SIM_LAYERS.ROADS_CLEAR)) {
      map.current.setLayoutProperty(SIM_LAYERS.ROADS_CLEAR, 'visibility', gisLayers.roads ? 'visible' : 'none');
    }
    if (map.current.getLayer(SIM_LAYERS.BUILDINGS_INTACT)) {
      map.current.setLayoutProperty(SIM_LAYERS.BUILDINGS_INTACT, 'visibility', gisLayers.shelters ? 'visible' : 'none');
    }
  }, [gisLayers]);

  // Sync layer opacities
  useEffect(() => {
    if (!map.current || !mapLayerService.initialized) return;
    Object.entries(layerOpacities).forEach(([key, opacity]) => {
      mapLayerService.setLayerOpacity(key, opacity);
    });
  }, [layerOpacities]);



  // Update epicenter marker when user clicks
  useEffect(() => {
    if (!map.current) return;
    const source = map.current.getSource('sim-epicenter-source');
    if (!source) return;

    if (!earthquakeEpicenter) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    source.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [earthquakeEpicenter.lng, earthquakeEpicenter.lat] }
      }]
    });
  }, [earthquakeEpicenter]);

  // Render simulation results
  useEffect(() => {
    if (!map.current) return;

    const tryUpdate = () => {
      const hazardSrc = map.current.getSource('sim-hazard-source');
      const buildingSrc = map.current.getSource('sim-buildings-source');
      const roadsSrc = map.current.getSource('sim-roads-source');

      if (!hazardSrc) return;

      if (!simulationResults) {
        const emptyFC = { type: 'FeatureCollection', features: [] };
        hazardSrc.setData(emptyFC);
        buildingSrc.setData(emptyFC);
        roadsSrc.setData(emptyFC);

        const shockwaveSrc = map.current.getSource('sim-shockwave-source');
        if (shockwaveSrc) {
          shockwaveSrc.setData(emptyFC);
        }
        if (shockwaveAnimRef.current) {
          cancelAnimationFrame(shockwaveAnimRef.current);
          shockwaveAnimRef.current = null;
        }

        return;
      }

      hazardSrc.setData(simulationResults.hazardZones);
      buildingSrc.setData(simulationResults.damagedBuildings);
      roadsSrc.setData(simulationResults.blockedRoads);

      // Trigger shockwave animation
      if (earthquakeEpicenter && simulationResults.stats) {
        playShockwave(earthquakeEpicenter, simulationResults.stats.radii.light);
      }
    };

    if (map.current.isStyleLoaded()) {
      tryUpdate();
    } else {
      map.current.once('styledata', tryUpdate);
    }
  }, [simulationResults, earthquakeEpicenter, playShockwave]);

  // Sync live earthquake feed
  useEffect(() => {
    if (!map.current) return;
    const source = map.current.getSource('sim-live-feed-source');
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: liveEarthquakes
      });
    }
  }, [liveEarthquakes]);

  // Sync ML Heatmap & Contours Data
  useEffect(() => {
    if (!map.current) return;
    const heatmapSource = map.current.getSource('sim-ml-heatmap-source');
    const contoursSource = map.current.getSource('sim-ml-contours-source');
    
    if (heatmapSource && contoursSource) {
      if (mlSimulationData && mlSimulationData.length > 0) {
        // Build GeoJSON FeatureCollection from JSON array
        const features = mlSimulationData.map((pt) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [pt.lng, pt.lat] },
          properties: { intensity: pt.intensity }
        }));
        const fc = { type: 'FeatureCollection', features };
        heatmapSource.setData(fc);

        try {
          const breaks = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
          const lines = isolines(fc, breaks, { zProperty: 'intensity' });
          contoursSource.setData(lines);
        } catch (err) {
          console.warn('[MapView] Failed to generate contours (grid might not be perfect):', err);
          contoursSource.setData({ type: 'FeatureCollection', features: [] });
        }
      } else {
        const emptyFC = { type: 'FeatureCollection', features: [] };
        heatmapSource.setData(emptyFC);
        contoursSource.setData(emptyFC);
      }
    }
  }, [mlSimulationData]);

  // Sync ML Layer Visibility & enforce top z-index stack order
  useEffect(() => {
    if (!map.current) return;
    
    const heatmapLayer = 'sim-ml-heatmap-layer';
    if (map.current.getLayer(heatmapLayer)) {
      map.current.setLayoutProperty(heatmapLayer, 'visibility', mlHeatmapVisible ? 'visible' : 'none');
      if (mlHeatmapVisible) map.current.moveLayer(heatmapLayer); // Move to top
    }
    
    const contoursLayer = 'sim-ml-contours-layer';
    if (map.current.getLayer(contoursLayer)) {
      map.current.setLayoutProperty(contoursLayer, 'visibility', mlContoursVisible ? 'visible' : 'none');
      if (mlContoursVisible) map.current.moveLayer(contoursLayer); // Move to top (above heatmap)
    }
  }, [mlHeatmapVisible, mlContoursVisible, mlSimulationData]);

  return (
    <div className="absolute inset-0 z-0">
      <div ref={mapContainer} className="w-full h-full cursor-crosshair" />
      {/* Cinematic vignette overlay — darker edges for command-center atmosphere */}
      {/* Uses mix-blend-multiply to darken map edges without affecting center visibility */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-950/30 to-slate-950/90 mix-blend-multiply" />
    </div>
  );
}
