import React, { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { isolines } from '@turf/isolines';
import useStore from '../store/useStore';
import { mapLayerService } from '../services/mapLayerService';
import { rasterService } from '../services/rasterService';
import { mapLayerManager } from '../services/mapLayerManager';
import { animationManager } from '../services/animationManager';

// Layer IDs for simulation visualization
const SIM_LAYERS = {
  WB_GRID_FILL: 'sim-wb-grid-fill',
  WB_HEATMAP: 'sim-wb-heatmap',
  SHOCKWAVE: 'sim-shockwave',
  EPICENTER: 'sim-epicenter',
};

export default function MapView() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  
  const mapViewport = useStore((state) => state.mapViewport);
  const earthquakeEpicenter = useStore((state) => state.earthquakeEpicenter);
  const setEarthquakeEpicenter = useStore((state) => state.setEarthquakeEpicenter);
  const setIsSimulationRunning = useStore((state) => state.setIsSimulationRunning);
  
  const gisLayers = useStore((state) => state.gisLayers);
  const layerOpacities = useStore((state) => state.layerOpacities);
  
  const simulationResults = useStore((state) => state.simulationResults);
  const mlSimulationData = useStore((state) => state.mlSimulationData);
  const mlHeatmapVisible = useStore((state) => state.mlHeatmapVisible);
  const mlContoursVisible = useStore((state) => state.mlContoursVisible);
  const mapStyle = useStore((state) => state.mapStyle);
  const showAmplifiedPga = useStore((state) => state.showAmplifiedPga);
  const activeModule = useStore((state) => state.activeModule);

  // Initialize simulation sources and layers on a loaded map
  const initSimulationLayers = useCallback((mapInstance) => {
    // --- Sources ---
    const emptyFC = { type: 'FeatureCollection', features: [] };

    mapLayerManager.addSourceSafe(mapInstance, 'sim-wb-grid-source', { type: 'geojson', data: emptyFC });
    mapLayerManager.addSourceSafe(mapInstance, 'sim-shockwave-source', { type: 'geojson', data: emptyFC });
    mapLayerManager.addSourceSafe(mapInstance, 'sim-epicenter-source', { type: 'geojson', data: emptyFC });
    mapLayerManager.addSourceSafe(mapInstance, 'sim-ml-heatmap-source', { type: 'geojson', data: emptyFC });
    mapLayerManager.addSourceSafe(mapInstance, 'sim-ml-contours-source', { type: 'geojson', data: emptyFC });

    // --- West Bengal Grid Fill (District Choropleth & Damage) ---
    mapLayerManager.addLayerSafe(mapInstance, {
      id: SIM_LAYERS.WB_GRID_FILL,
      type: 'fill',
      source: 'sim-wb-grid-source',
      paint: {
        'fill-color': [
          'match',
          ['get', 'damage_level'],
          'Negligible', 'rgba(34, 197, 94, 0.6)',  // Green
          'Light', 'rgba(234, 179, 8, 0.6)',       // Yellow
          'Moderate', 'rgba(249, 115, 22, 0.7)',   // Orange
          'Strong', 'rgba(239, 68, 68, 0.8)',      // Red
          'Severe', 'rgba(185, 28, 28, 0.9)',      // Dark Red
          'rgba(255, 255, 255, 0.1)'
        ],
        'fill-outline-color': 'rgba(255, 255, 255, 0.2)',
        'fill-opacity': 0.7
      }
    });

    // --- Smooth PGA Heatmap ---
    mapLayerManager.addLayerSafe(mapInstance, {
      id: SIM_LAYERS.WB_HEATMAP,
      type: 'heatmap',
      source: 'sim-wb-grid-source',
      maxzoom: 15,
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'adjusted_pga'], 0, 0, 0.5, 1],
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
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 15, 80],
        'heatmap-opacity': 0.6
      }
    }, SIM_LAYERS.WB_GRID_FILL);

    // --- Shockwave (animated ring) ---
    mapLayerManager.addLayerSafe(mapInstance, {
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
    mapLayerManager.addLayerSafe(mapInstance, {
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
    mapLayerManager.addLayerSafe(mapInstance, {
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
    mapLayerManager.addLayerSafe(mapInstance, {
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
    mapLayerManager.addLayerSafe(mapInstance, {
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
    mapLayerManager.addLayerSafe(mapInstance, {
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

  useEffect(() => {
    // Provide store action to animation manager
    animationManager.setStoreActions(setIsSimulationRunning);
  }, [setIsSimulationRunning]);

  // Main Map Initialization Effect
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
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
          },
          'osm-light': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
          }
        },
        layers: [
          {
            id: 'osm-dark-layer',
            type: 'raster',
            source: 'osm-dark',
            minzoom: 0,
            maxzoom: 22,
            layout: { visibility: 'visible' }
          },
          {
            id: 'osm-light-layer',
            type: 'raster',
            source: 'osm-light',
            minzoom: 0,
            maxzoom: 22,
            layout: { visibility: 'none' }
          }
        ]
      },
      // Safely use initial viewport state (only evaluated once during setup)
      center: [useStore.getState().mapViewport.longitude, useStore.getState().mapViewport.latitude],
      zoom: useStore.getState().mapViewport.zoom,
      pitch: 0,
      bearing: 0,
      antialias: true
    });

    // Automatically fit to India's bounds on initial load
    map.current.fitBounds([
      [68.7, 8.4], // Southwestern corner
      [97.25, 37.6] // Northeastern corner
    ], { padding: 50, duration: 1500 });

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    const onMapClick = (e) => {
      // ONLY allow setting earthquake epicenter if the Earthquake module is active
      if (useStore.getState().activeModule !== 'earthquake') return;

      // Don't set epicenter if user clicked a landslide circle
      if (map.current.getLayer('landslides-circles')) {
        const landslideFeatures = map.current.queryRenderedFeatures(e.point, {
          layers: ['landslides-circles']
        });
        if (landslideFeatures.length > 0) return;
      }
      
      setEarthquakeEpicenter({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    };

    map.current.on('click', onMapClick);

    // Landslide popup
    map.current.on('click', 'landslides-circles', (e) => {
      const p = e.features[0].properties;
      new maplibregl.Popup({ maxWidth: '280px' })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family:sans-serif;padding:6px;">
            <b style="font-size:14px;">${p.location}</b><br/>
            <span style="color:#6b7280;font-size:12px;">${p.state}</span>
            <hr style="margin:6px 0;border-color:#e5e7eb;"/>
            <table style="font-size:12px;width:100%;">
              <tr><td style="color:#6b7280;">Date</td>
                  <td style="text-align:right;">${p.date}</td></tr>
              <tr><td style="color:#6b7280;">Deaths</td>
                  <td style="text-align:right;color:#dc2626;font-weight:bold;">${p.deaths}</td></tr>
              <tr><td style="color:#6b7280;">Trigger</td>
                  <td style="text-align:right;">${p.trigger}</td></tr>
              <tr><td style="color:#6b7280;">Type</td>
                  <td style="text-align:right;">${p.type}</td></tr>
              <tr><td style="color:#6b7280;">Severity</td>
                  <td style="text-align:right;">${p.severity}</td></tr>
              <tr><td style="color:#6b7280;">Source</td>
                  <td style="text-align:right;color:#6b7280;">${p.source}</td></tr>
            </table>
            ${p.notes ? `<p style="font-size:11px;color:#6b7280;margin:6px 0 0;font-style:italic;">${p.notes}</p>` : ''}
          </div>
        `)
        .addTo(map.current);
    });

    map.current.on('mouseenter', 'landslides-circles', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'landslides-circles', () => {
      map.current.getCanvas().style.cursor = 'crosshair';
    });

    map.current.on('style.load', () => {
      initSimulationLayers(map.current);
      mapLayerService.initializeSourcesAndLayers(map.current, useStore.getState().gisLayers);
      rasterService.setMap(map.current);
      setIsStyleLoaded(true); // Tell React that the style is safe to interact with
    });

    return () => {
      animationManager.stopShockwave();
      if (map.current) {
        map.current.off('click', onMapClick);
        map.current.remove(); // Cleanly destroy the map on unmount
        map.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array prevents the map from completely remounting on state changes

  // Sync Map Theme (Dark/Light)
  useEffect(() => {
    if (!isStyleLoaded || !map.current) return;
    if (mapLayerManager.layerExists(map.current, 'osm-dark-layer')) {
      map.current.setLayoutProperty('osm-dark-layer', 'visibility', mapStyle === 'dark' ? 'visible' : 'none');
    }
    if (mapLayerManager.layerExists(map.current, 'osm-light-layer')) {
      map.current.setLayoutProperty('osm-light-layer', 'visibility', mapStyle === 'light' ? 'visible' : 'none');
    }
  }, [mapStyle, isStyleLoaded]);

  // Sync GIS layer visibility
  useEffect(() => {
    if (!isStyleLoaded || !map.current || !mapLayerService.initialized) return;
    Object.entries(gisLayers).forEach(([key, isToggled]) => {
      let isVisible = isToggled;
      // Hide landslide-specific GeoJSON layers when not in the Landslide module
      if (key === 'landslides') {
        isVisible = isToggled && activeModule === 'landslide';
      }
      mapLayerService.setLayerVisibility(key, isVisible);
    });
  }, [gisLayers, activeModule, isStyleLoaded]);

  // Sync layer opacities
  useEffect(() => {
    if (!isStyleLoaded || !map.current || !mapLayerService.initialized) return;
    Object.entries(layerOpacities).forEach(([key, opacity]) => {
      mapLayerService.setLayerOpacity(key, opacity);
    });
  }, [layerOpacities, isStyleLoaded]);

  // Update epicenter marker when user clicks or simulation clears
  useEffect(() => {
    if (!isStyleLoaded || !map.current) return;
    const source = map.current.getSource('sim-epicenter-source');
    if (!source) return;

    if (!earthquakeEpicenter || activeModule !== 'earthquake') {
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
  }, [earthquakeEpicenter, isStyleLoaded]);

  // Render simulation results and trigger shockwave
  useEffect(() => {
    if (!isStyleLoaded || !map.current) return;

    try {
      const wbGridSrc = map.current.getSource('sim-wb-grid-source');
      if (!wbGridSrc) return;

      if (!simulationResults) {
        // Clear simulation map data cleanly
        mapLayerManager.clearSourcesData(map.current, ['sim-wb-grid-source', 'sim-shockwave-source']);
        animationManager.stopShockwave();
        return;
      }

      // Defensive check for valid GeoJSON before pushing to MapLibre
      if (!simulationResults.grid_geojson || !simulationResults.grid_geojson.type) {
        console.warn('[MapView] Invalid grid_geojson received, aborting render.');
        return;
      }

      wbGridSrc.setData(simulationResults.grid_geojson);

      // Trigger shockwave animation out to an arbitrary radius
      if (earthquakeEpicenter) {
        animationManager.startShockwave(map.current, earthquakeEpicenter, 300); // 300km
      }
    } catch (err) {
      console.error('[MapView] Failed to render simulation results:', err);
    }
  }, [simulationResults, earthquakeEpicenter, isStyleLoaded]);

  // Sync ML Heatmap & Contours Data
  useEffect(() => {
    if (!isStyleLoaded || !map.current) return;
    
    const heatmapSource = map.current.getSource('sim-ml-heatmap-source');
    const contoursSource = map.current.getSource('sim-ml-contours-source');
    
    if (!heatmapSource || !contoursSource) return;

    if (mlSimulationData && mlSimulationData.length > 0) {
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
        console.warn('[MapView] Failed to generate contours:', err);
        contoursSource.setData({ type: 'FeatureCollection', features: [] });
      }
    } else {
      mapLayerManager.clearSourcesData(map.current, ['sim-ml-heatmap-source', 'sim-ml-contours-source']);
    }
  }, [mlSimulationData, isStyleLoaded]);

  // Sync ML Layer Visibility & enforce top z-index stack order
  useEffect(() => {
    if (!isStyleLoaded || !map.current) return;
    
    const heatmapLayer = 'sim-ml-heatmap-layer';
    if (mapLayerManager.layerExists(map.current, heatmapLayer)) {
      map.current.setLayoutProperty(heatmapLayer, 'visibility', mlHeatmapVisible ? 'visible' : 'none');
      if (mlHeatmapVisible) map.current.moveLayer(heatmapLayer);
    }
    
    const contoursLayer = 'sim-ml-contours-layer';
    if (mapLayerManager.layerExists(map.current, contoursLayer)) {
      map.current.setLayoutProperty(contoursLayer, 'visibility', mlContoursVisible ? 'visible' : 'none');
      if (mlContoursVisible) map.current.moveLayer(contoursLayer);
    }
  }, [mlHeatmapVisible, mlContoursVisible, mlSimulationData, isStyleLoaded]);

  // Sync PGA Weight (Raw vs Amplified)
  useEffect(() => {
    if (!isStyleLoaded || !map.current) return;
    
    if (mapLayerManager.layerExists(map.current, SIM_LAYERS.WB_HEATMAP)) {
      map.current.setPaintProperty(SIM_LAYERS.WB_HEATMAP, 'heatmap-weight', [
        'interpolate', ['linear'], 
        ['get', showAmplifiedPga ? 'adjusted_pga' : 'base_pga'], 
        0, 0, 0.5, 1
      ]);
    }
  }, [showAmplifiedPga, simulationResults, isStyleLoaded]);

  // Automatically fetch and toggle Landslide Raster Layers
  useEffect(() => {
    if (!isStyleLoaded || !map.current || !rasterService) return;

    const handleRasterToggle = async (key, url) => {
      const layerId = `${key}-raster`;
      
      // Only show the layer if its toggle is on AND we are actively looking at the Landslide module
      const isVisible = gisLayers[key] && activeModule === 'landslide';
      
      // If toggled ON and hasn't been loaded into cache yet
      if (isVisible && !rasterService.rasterCache.has(layerId)) {
        try {
          // Tell raster service to fetch, decode, and render it to MapLibre
          await rasterService.addGeoTiffFromUrl(url, layerId, { 
            opacity: layerOpacities[key] || 0.8,
            onStateChange: (state) => useStore.getState().setRasterLoadingState(key, state),
            dataMin: key === 'slopeRisk' ? 0 : undefined,
            dataMax: key === 'slopeRisk' ? 2500 : undefined
          });
        } catch (e) {
          useStore.getState().setRasterLoadingState(key, 'failed');
          console.error(`[MapView] Failed to auto-load ${key} raster:`, e);
          alert(`Could not load ${key} layer. If you just added the file, try restarting the React server! Error: ${e.message}`);
        }
      } else if (rasterService.rasterCache.has(layerId)) {
        // If it's already loaded, just toggle the maplibre visibility property
        rasterService.updateVisibility(layerId, isVisible);
      }
    };

    handleRasterToggle('slopeRisk', '/rasters/slope_risk.tif');
    handleRasterToggle('soilMoisture', '/rasters/soil_moisture.tif');

  }, [gisLayers.slopeRisk, gisLayers.soilMoisture, activeModule, isStyleLoaded]);

  return (
    <div className="absolute inset-0 z-0">
      <div ref={mapContainer} className="w-full h-full cursor-crosshair" />
      {/* Cinematic vignette overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-950/30 to-slate-950/90 mix-blend-multiply" />
    </div>
  );
}