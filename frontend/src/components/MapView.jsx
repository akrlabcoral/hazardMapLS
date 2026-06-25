import React, { useEffect, useRef, useCallback, useState } from 'react';
import { isolines } from '@turf/isolines';
import maplibregl from 'maplibre-gl';
import useStore from '../store/useStore';
import { mapLayerService } from '../services/mapLayerService';
import { rasterService } from '../services/rasterService';
import { mapLayerManager } from '../services/mapLayerManager';
import { animationManager } from '../services/animationManager';

// Layer IDs for simulation visualization
const SIM_LAYERS = {
  WB_GRID_FILL:   'sim-wb-grid-fill',
  CONTOUR_FILL:   'sim-contour-fill',
  CONTOUR_STROKE: 'sim-contour-stroke',
  SHOCKWAVE:      'sim-shockwave',
  EPICENTER:      'sim-epicenter',
  SOIL_AMP:       'sim-soil-amp-layer',
};

export default function MapView() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const mapViewport = useStore((state) => state.mapViewport);
  
  const earthquakeEpicenter    = useStore((state) => state.earthquakeEpicenter);
  const setEarthquakeEpicenter = useStore((state) => state.setEarthquakeEpicenter);
  const setIsSimulationRunning = useStore((state) => state.setIsSimulationRunning);
  const selectedStateName      = useStore((state) => state.selectedStateName);
  
  const gisLayers      = useStore((state) => state.gisLayers);
  const layerOpacities = useStore((state) => state.layerOpacities);
  const soilAmpVisible = useStore((state) => state.soilAmpVisible);
  
  const simulationResults = useStore((state) => state.simulationResults);
  const mlSimulationData = useStore((state) => state.mlSimulationData);
  const mlHeatmapVisible = useStore((state) => state.mlHeatmapVisible);
  const mlContoursVisible = useStore((state) => state.mlContoursVisible);
  const heatwaveActiveLayer = useStore((state) => state.heatwaveActiveLayer);
  const mapClearToken = useStore((state) => state.mapClearToken);
  const activeModule = useStore((state) => state.activeModule);
  const landslideType = useStore((state) => state.landslideType);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);

  const mapStyle          = useStore((state) => state.mapStyle);

  // Initialize simulation sources and layers on a loaded map
  const initSimulationLayers = useCallback((mapInstance) => {
    const emptyFC = { type: 'FeatureCollection', features: [] };

    mapLayerManager.addSourceSafe(mapInstance, 'sim-wb-grid-source',    { type: 'geojson', data: emptyFC });
    mapLayerManager.addSourceSafe(mapInstance, 'sim-contour-source',    { type: 'geojson', data: emptyFC });
    mapLayerManager.addSourceSafe(mapInstance, 'sim-shockwave-source',  { type: 'geojson', data: emptyFC });
    mapLayerManager.addSourceSafe(mapInstance, 'sim-epicenter-source',  { type: 'geojson', data: emptyFC });

    mapLayerManager.addSourceSafe(mapInstance, 'sim-ml-heatmap-source', { type: 'geojson', data: emptyFC });
    mapLayerManager.addSourceSafe(mapInstance, 'sim-ml-contours-source', { type: 'geojson', data: emptyFC });

    // --- ML Heatmap Layer ---
    mapLayerManager.addLayerSafe(mapInstance, {
      id: 'sim-ml-heatmap-layer',
      type: 'heatmap',
      source: 'sim-ml-heatmap-source',
      maxzoom: 15,
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity_normalized'], 0, 0, 1.0, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1.2, 15, 6.0],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0.0, 'rgba(16,185,129,0)',
          0.1, 'rgba(16,185,129,0.2)',
          0.3, '#10b981',
          0.5, '#eab308',
          0.7, '#f97316',
          0.9, '#ef4444'
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
          0.1, '#06b6d4',
          0.3, '#10b981',
          0.5, '#eab308',
          0.7, '#f97316',
          0.9, '#ef4444'
        ],
        'line-width': 2,
        'line-opacity': 0.9,
        'line-dasharray': [2, 1]
      }
    });


    // --- Soil Amplification Choropleth (Vs30 Site Classification) ---
    // Clipped to heatmap footprint: only cells with meaningful PGA are rendered.
    // Rendered from soil_factor property: blue (Site A/hard rock) → red (Site E/soft soil)
    mapLayerManager.addLayerSafe(mapInstance, {
      id: SIM_LAYERS.SOIL_AMP,
      type: 'fill',
      source: 'sim-wb-grid-source',
      layout: { visibility: 'none' }, // hidden until user enables toggle
      // Only show cells inside the shaking footprint (pga_base > 0.001g)
      filter: ['>', ['get', 'pga_base'], 0.001],
      paint: {
        'fill-color': [
          'interpolate', ['linear'], ['get', 'soil_factor'],
          0.80, '#1e40af',  // deep blue  → Site A (Hard Rock, de-amplifies)
          1.00, '#3b82f6',  // blue       → Site B (Rock, neutral)
          1.20, '#22c55e',  // green      → Site C (Dense Soil)
          1.40, '#f97316',  // orange     → Site D (Stiff Soil)
          1.70, '#ef4444',  // red        → Site E (Soft Clay, max amplification)
        ],
        'fill-opacity': 0.75,
      }
    }, SIM_LAYERS.WB_GRID_FILL);

    // --- Popup tooltip for grid cells (shows vs30 + site_class) ---
    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
    mapInstance.on('mousemove', SIM_LAYERS.SOIL_AMP, (e) => {
      if (!e.features?.length) return;
      mapInstance.getCanvas().style.cursor = 'crosshair';
      const p = e.features[0].properties;
      const siteColors = { A: '#3b82f6', B: '#60a5fa', C: '#22c55e', D: '#f97316', E: '#ef4444' };
      const cls = p.site_class || '–';
      const color = siteColors[cls] || '#94a3b8';
      popup.setLngLat(e.lngLat).setHTML(`
        <div style="background:#0f172a;border:1px solid #334155;padding:10px 14px;border-radius:10px;font-family:monospace;font-size:12px;color:#e2e8f0;min-width:160px">
          <div style="font-weight:700;font-size:13px;border-bottom:1px solid #334155;padding-bottom:6px;margin-bottom:8px;color:#fff">Soil Site Data</div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="color:#94a3b8">Vs30:</span>
            <span style="color:#22d3ee;font-weight:600">${p.vs30 ?? '–'} m/s</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="color:#94a3b8">Site Class:</span>
            <span style="color:${color};font-weight:700">NEHRP ${cls}</span>
          </div>
          <div style="display:flex;justify-content:space-between">
            <span style="color:#94a3b8">Amplification:</span>
            <span style="color:#a78bfa;font-weight:600">${p.soil_factor ?? '–'}×</span>
          </div>
        </div>
      `).addTo(mapInstance);
    });
    mapInstance.on('mouseleave', SIM_LAYERS.SOIL_AMP, () => {
      mapInstance.getCanvas().style.cursor = '';
      popup.remove();
    });


    // --- Hazard Grid Fill (Choropleth by fused_hazard score) ---
    mapLayerManager.addLayerSafe(mapInstance, {
      id: SIM_LAYERS.WB_GRID_FILL,
      type: 'fill',
      source: 'sim-wb-grid-source',
      paint: {
        'fill-color': [
          'interpolate', ['linear'], ['get', 'fused_hazard'],
          0.0, 'rgba(34, 197, 94, 0.0)',
          0.2, 'rgba(34, 197, 94, 0.5)',
          0.4, 'rgba(234, 179, 8, 0.6)',
          0.6, 'rgba(249, 115, 22, 0.7)',
          0.8, 'rgba(239, 68, 68, 0.8)',
          1.0, 'rgba(185, 28, 28, 0.95)',
        ],
        'fill-opacity': [
          'interpolate', ['linear'], ['zoom'],
          4, 0.3,
          10, 0.8
        ],
        'fill-outline-color': [
          'interpolate', ['linear'], ['zoom'],
          4, 'rgba(255, 255, 255, 0.05)',
          10, 'rgba(255, 255, 255, 0.4)'
        ],
      }
    });

    // --- Smooth PGA Contour fill overlay ---
    // fill-opacity must be embedded in the rgba color — data-driven fill-opacity
    // is not reliably supported in all MapLibre versions.
    mapLayerManager.addLayerSafe(mapInstance, {
      id: SIM_LAYERS.CONTOUR_FILL,
      type: 'fill',
      source: 'sim-contour-source',
      paint: {
        // Build rgba by appending 0.55 alpha to the fill hex from the GeoJSON
        'fill-color': [
          'case',
          ['has', 'fill'], ['get', 'fill'],
          'rgba(0,0,0,0)'
        ],
        'fill-opacity': 0.55,
      }
    });

    // --- Contour stroke (band boundaries) ---
    mapLayerManager.addLayerSafe(mapInstance, {
      id: SIM_LAYERS.CONTOUR_STROKE,
      type: 'line',
      source: 'sim-contour-source',
      paint: {
        'line-color': [
          'case',
          ['has', 'stroke'], ['get', 'stroke'],
          '#ffffff'
        ],
        'line-width': 1.5,
        'line-opacity': 0.85,
      }
    });

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

    // --- Epicenter atmospheric glow ---
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

    // --- Epicenter outer ring ---
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

    // --- Epicenter marker ---
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

  }, []);

  useEffect(() => {
    animationManager.setStoreActions(setIsSimulationRunning);
  }, [setIsSimulationRunning]);

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
            layout: { visibility: 'none' }
          },
          {
            id: 'osm-light-layer',
            type: 'raster',
            source: 'osm-light',
            minzoom: 0,
            maxzoom: 22,
            layout: { visibility: 'visible' }
          }
        ]
      },
      center: [mapViewport.longitude, mapViewport.latitude],
      zoom: mapViewport.zoom,
      pitch: 0,
      bearing: 0,
      antialias: true
    });

    map.current.fitBounds([
      [68.7, 8.4],
      [97.25, 37.6]
    ], { padding: 50, duration: 1500 });

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    
    const onMapClick = (e) => {
      const activeModule = useStore.getState().activeModule;
      if (activeModule !== 'earthquake' && activeModule !== 'landslide') return;
      if (map.current.getLayer('landslides-circles')) {
        const landslideFeatures = map.current.queryRenderedFeatures(e.point, {
          layers: ['landslides-circles']
        });
        if (landslideFeatures.length > 0) return;
      }
      
      if (useStore.getState().isPlacingEpicenter) {
        const coords = { lng: e.lngLat.lng, lat: e.lngLat.lat };
        setEarthquakeEpicenter(coords);
        useStore.getState().setIsPlacingEpicenter(false);
      }
    };
    
    const onMouseDown = (e) => {
      if (e.originalEvent && e.originalEvent.button === 1) { // Middle mouse button
        e.originalEvent.preventDefault();
        const coords = { lng: e.lngLat.lng, lat: e.lngLat.lat };
        console.log('[Epicenter] Middle-click => setting epicenter:', coords);
        setEarthquakeEpicenter(coords);
      }
    };
    
    map.current.on('click', onMapClick);
    map.current.on('mousedown', onMouseDown);

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
              <tr><td style="color:#6b7280;">Date</td><td style="text-align:right;">${p.date}</td></tr>
              <tr><td style="color:#6b7280;">Deaths</td><td style="text-align:right;color:#dc2626;font-weight:bold;">${p.deaths}</td></tr>
            </table>
          </div>
        `)
        .addTo(map.current);
    });

    map.current.on('mouseenter', 'landslides-circles', () => { map.current.getCanvas().style.cursor = 'pointer'; });
    map.current.on('mouseleave', 'landslides-circles', () => { map.current.getCanvas().style.cursor = ''; });


    // --- Simulation Layer Popups (Heatwave & Landslide/Earthquake) ---
    const handleSimulationClick = (e) => {
      const activeModule = useStore.getState().activeModule;
      const p = e.features[0].properties;

      if (activeModule === 'heatwave') {
        new maplibregl.Popup({ maxWidth: '280px' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:sans-serif;padding:6px;min-width:180px;color:#1e293b;">
              <b style="font-size:14px;color:#0f172a;">${p.district || 'Region Data Unavailable'}</b><br/>
              <span style="color:#64748b;font-size:12px;">${p.state || 'Unknown State'}</span>
              <hr style="margin:6px 0;border-color:#e2e8f0;"/>
              <table style="font-size:12px;width:100%;">
                <tr><td style="color:#64748b;">Temperature</td><td style="text-align:right;font-weight:bold;color:#f97316;">${p.temperature ? p.temperature + '°C' : 'N/A'}</td></tr>
                <tr><td style="color:#64748b;">Status</td><td style="text-align:right;font-weight:bold;color:#dc2626;">${p.status || 'N/A'}</td></tr>
              </table>
            </div>
          `)
          .addTo(map.current);
      } else if (['landslide', 'earthquake', 'combined'].includes(activeModule)) {
        if (p.fused_hazard === undefined && p.hazard_probability === undefined) return; // ensure it's a valid grid cell
        
        const totalHaz = p.hazard_probability !== undefined ? p.hazard_probability : p.fused_hazard;
        
        new maplibregl.Popup({ maxWidth: '300px' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:sans-serif;padding:6px;min-width:200px;color:#1e293b;">
              <b style="font-size:14px;color:#0f172a;">${p.district || 'Unknown'}, ${p.state || 'Unknown'}</b><br/>
              <hr style="margin:6px 0;border-color:#e2e8f0;"/>
              <table style="font-size:12px;width:100%;">
                <tr><td style="color:#64748b;">Total Hazard</td><td style="text-align:right;font-weight:bold;color:#dc2626;">${totalHaz !== undefined ? (totalHaz * 100).toFixed(1) + '%' : 'N/A'}</td></tr>
                ${p.susceptibility !== undefined ? `<tr><td style="color:#64748b;">Susceptibility</td><td style="text-align:right;font-weight:bold;color:#f97316;">${(p.susceptibility * 100).toFixed(1)}%</td></tr>` : ''}
                ${p.trigger_probability !== undefined ? `<tr><td style="color:#64748b;">Trigger Prob</td><td style="text-align:right;font-weight:bold;color:#3b82f6;">${(p.trigger_probability * 100).toFixed(1)}%</td></tr>` : ''}
                ${p.historical_density !== undefined ? `<tr><td style="color:#64748b;">Hist. Density</td><td style="text-align:right;">${(p.historical_density * 100).toFixed(1)}%</td></tr>` : ''}
                ${p.pga_base !== undefined ? `<tr><td style="color:#64748b;">Max PGA</td><td style="text-align:right;font-weight:bold;color:#f97316;">${p.pga_base.toFixed(3)}g</td></tr>` : ''}
              </table>
            </div>
          `)
          .addTo(map.current);
      }
    };

    map.current.on('click', SIM_LAYERS.WB_GRID_FILL, handleSimulationClick);
    map.current.on('click', SIM_LAYERS.CONTOUR_FILL, handleSimulationClick);

    map.current.on('mouseenter', SIM_LAYERS.WB_GRID_FILL, () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', SIM_LAYERS.WB_GRID_FILL, () => {
      map.current.getCanvas().style.cursor = '';
    });
    map.current.on('mouseenter', SIM_LAYERS.CONTOUR_FILL, () => {
      if (useStore.getState().activeModule !== 'heatwave') {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    });
    map.current.on('mouseleave', SIM_LAYERS.CONTOUR_FILL, () => {
      map.current.getCanvas().style.cursor = '';
    });

    map.current.on('style.load', () => {
      initSimulationLayers(map.current);
      mapLayerService.initializeSourcesAndLayers(map.current, useStore.getState().gisLayers);
      rasterService.setMap(map.current);
      setIsStyleLoaded(true);

      fetch('/data/india_states.geojson')
        .then(res => res.json())
        .then(data => {
          const mapping = {};
          data.features.forEach(f => {
            mapping[f.properties.state || f.properties.STATE] = f.id;
          });
          useStore.getState().setStateIdMapping(mapping);
        });

      let hoveredStateId = null;

      map.current.on('mousemove', 'state-boundaries-fill', (e) => {
        if (e.features.length > 0) {
          if (hoveredStateId !== null) {
            map.current.setFeatureState(
              { source: 'state-boundaries-source', id: hoveredStateId },
              { hover: false }
            );
          }
          hoveredStateId = e.features[0].id;
          map.current.setFeatureState(
            { source: 'state-boundaries-source', id: hoveredStateId },
            { hover: true }
          );
          useStore.getState().setHoveredStateId(hoveredStateId);
          useStore.getState().setMousePos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY });
        }
      });

      map.current.on('mouseleave', 'state-boundaries-fill', () => {
        if (hoveredStateId !== null) {
          map.current.setFeatureState(
            { source: 'state-boundaries-source', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = null;
        useStore.getState().setHoveredStateId(null);
      });
    });

    return () => {
      animationManager.stopShockwave();
      if (map.current) {
        map.current.off('click', onMapClick);
        map.current.off('mousedown', onMouseDown);
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapViewport, setEarthquakeEpicenter, initSimulationLayers]);

  // Sync Map Theme (Dark/Light)
  useEffect(() => {
    if (!map.current || !map.current.getStyle()) return;
    if (mapLayerManager.layerExists(map.current, 'osm-dark-layer')) {
      map.current.setLayoutProperty('osm-dark-layer', 'visibility', mapStyle === 'dark' ? 'visible' : 'none');
    }
    if (mapLayerManager.layerExists(map.current, 'osm-light-layer')) {
      map.current.setLayoutProperty('osm-light-layer', 'visibility', mapStyle === 'light' ? 'visible' : 'none');
    }
  }, [mapStyle]);


  // Sync GIS layer visibility
  useEffect(() => {
    if (!map.current || !mapLayerService.initialized) return;
    Object.entries(gisLayers).forEach(([key, isToggled]) => {
      let isVisible = isToggled;
      if (key === 'landslides') {
        isVisible = isToggled && activeModule === 'landslide';
      }
      mapLayerService.setLayerVisibility(key, isVisible);
    });
  }, [gisLayers, activeModule]);


  // Sync layer opacities
  useEffect(() => {
    if (!map.current || !mapLayerService.initialized) return;
    Object.entries(layerOpacities).forEach(([key, opacity]) => {
      mapLayerService.setLayerOpacity(key, opacity);
    });
  }, [layerOpacities]);

  // Update epicenter marker
  useEffect(() => {
    if (!map.current || !map.current.getStyle()) return;
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

  // Sync Soil Amplification layer visibility
  useEffect(() => {
    if (!map.current || !map.current.getStyle()) return;
    if (mapLayerManager.layerExists(map.current, SIM_LAYERS.SOIL_AMP)) {
      map.current.setLayoutProperty(
        SIM_LAYERS.SOIL_AMP, 
        'visibility', 
        soilAmpVisible ? 'visible' : 'none'
      );
    }
  }, [soilAmpVisible]);

  // Sync state isolation filter
  useEffect(() => {
    if (!map.current || !map.current.getStyle()) return;
    const filter = selectedStateName ? ['==', ['get', 'state'], selectedStateName] : null;
    
    if (mapLayerManager.layerExists(map.current, SIM_LAYERS.WB_GRID_FILL)) {
      map.current.setFilter(SIM_LAYERS.WB_GRID_FILL, filter);
    }
    if (mapLayerManager.layerExists(map.current, SIM_LAYERS.CONTOUR_FILL)) {
      map.current.setFilter(SIM_LAYERS.CONTOUR_FILL, filter);
    }
  }, [selectedStateName]);

  useEffect(() => {
    if (!map.current || !map.current.getStyle()) return;

    const simulationSources = [
      'sim-wb-grid-source',
      'sim-contour-source',
      'sim-shockwave-source',
      'sim-epicenter-source',
      'sim-ml-heatmap-source',
      'sim-ml-contours-source',
    ];
    mapLayerManager.clearSourcesData(map.current, simulationSources);

    [
      SIM_LAYERS.CONTOUR_FILL,
      SIM_LAYERS.CONTOUR_STROKE,
      SIM_LAYERS.WB_GRID_FILL,
      SIM_LAYERS.SOIL_AMP,
      SIM_LAYERS.SHOCKWAVE,
      SIM_LAYERS.EPICENTER,
      'sim-epicenter-glow',
      'sim-epicenter-ring',
      'sim-ml-heatmap-layer',
      'sim-ml-contours-layer',
    ].forEach((layerId) => {
      if (map.current.getLayer(layerId)) {
        map.current.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });

    try {
      if (map.current.getSource('state-boundaries-source')) {
        map.current.removeFeatureState({ source: 'state-boundaries-source' });
      }
    } catch (err) {
      console.warn('[MapView] Failed to remove feature state:', err);
    }

    animationManager.stopShockwave();
  }, [mapClearToken]);

  // Render simulation results and trigger shockwave
  useEffect(() => {
    if (!map.current) return;

    const updateSimulationResults = () => {
      try {
        const wbGridSrc = map.current.getSource('sim-wb-grid-source');
        const contourSrc = map.current.getSource('sim-contour-source');

        if (!simulationResults) {
          console.log('[MapView] simulationResults cleared — aggressively wiping all map data');
          
          if (wbGridSrc) wbGridSrc.setData({ type: 'FeatureCollection', features: [] });
          if (contourSrc) contourSrc.setData({ type: 'FeatureCollection', features: [] });
          
          const layersToHide = [
            SIM_LAYERS.CONTOUR_FILL, 
            SIM_LAYERS.CONTOUR_STROKE, 
            SIM_LAYERS.WB_GRID_FILL, 
            SIM_LAYERS.SOIL_AMP
          ];
          
          layersToHide.forEach(layer => {
            if (map.current.getLayer(layer)) {
              map.current.setLayoutProperty(layer, 'visibility', 'none');
            }
          });
          
          // Clear feature states
          try {
            if (map.current.getSource('state-boundaries-source')) {
              map.current.removeFeatureState({ source: 'state-boundaries-source' });
            }
          } catch (e) {
            console.warn('[MapView] Failed to remove feature state:', e);
          }

          animationManager.stopShockwave();
          return;
        }

        if (!wbGridSrc || !contourSrc) {
          console.warn('[MapView] Sources not ready yet, skipping render');
          return;
        }

        if (!simulationResults.grid_geojson || !simulationResults.grid_geojson.type) {
          console.warn('[MapView] Invalid grid_geojson received, aborting render.');
          return;
        }

        // Log the epicenter the backend used (embedded in features) vs current store
        const currentEpicenter = useStore.getState().earthquakeEpicenter;
        console.log('[MapView] Rendering new simulation results. Current store epicenter:', currentEpicenter);
        console.log('[MapView] Grid features count:', simulationResults.grid_geojson.features?.length);

        let gridData = simulationResults.grid_geojson;
        const isSeismicLandslide = activeModule === 'landslide' && landslideType === 'earthquake';

        // The backend now pre-filters features to the affected radius
        wbGridSrc.setData(gridData);
        if (simulationResults.contour_geojson) {
          contourSrc.setData(simulationResults.contour_geojson);
        }
        
        // ── Unified rendering: ALL modules use CONTOUR_FILL (smooth bands) ──
        const showGrid = false; // Always use contours for unified visual language
        const showContours = true;
        
        if (map.current.getLayer(SIM_LAYERS.CONTOUR_FILL))   map.current.setLayoutProperty(SIM_LAYERS.CONTOUR_FILL,   'visibility', showContours ? 'visible' : 'none');
        if (map.current.getLayer(SIM_LAYERS.CONTOUR_STROKE)) map.current.setLayoutProperty(SIM_LAYERS.CONTOUR_STROKE, 'visibility', showContours ? 'visible' : 'none');
        
        if (map.current.getLayer(SIM_LAYERS.WB_GRID_FILL)) {
          // WB_GRID_FILL kept hidden; contours are the primary visual
          map.current.setLayoutProperty(SIM_LAYERS.WB_GRID_FILL, 'visibility', 'none');
          map.current.setPaintProperty(SIM_LAYERS.WB_GRID_FILL, 'fill-opacity', 0.0);
        }
        console.log('[MapView] Layers made visible:', SIM_LAYERS.CONTOUR_FILL, SIM_LAYERS.CONTOUR_STROKE);

        if (simulationResults.state_summary) {
          const mapping = useStore.getState().stateIdMapping;
          if (mapping) {
            Object.values(simulationResults.state_summary).forEach(summary => {
              const stateId = mapping[summary.state];
              if (stateId) {
                map.current.setFeatureState(
                  { source: 'state-boundaries-source', id: stateId },
                  { 
                    avg_pga: summary.avg_pga,
                    max_pga: summary.max_pga,
                    risk_category: summary.risk_category,
                    pop_affected: summary.pop_affected,
                    damage_score: summary.damage_score
                  }
                );
              }
            });
          }
        }

        if (earthquakeEpicenter) {
          console.log('[MapView] Starting shockwave at epicenter:', earthquakeEpicenter);
          animationManager.startShockwave(map.current, earthquakeEpicenter, 300);
        }
      } catch (err) {
        console.error('[MapView] Failed to render simulation results:', err);
      }
    };

    // Always run immediately — isStyleLoaded() check causes race condition on first click
    // The try/catch inside updateSimulationResults handles any timing issues
    updateSimulationResults();
  }, [simulationResults, earthquakeEpicenter, activeModule, landslideType]);

  
  // Sync ML Heatmap & Contours Data
  useEffect(() => {
    if (!isStyleLoaded || !map.current) return;
    
    const heatmapSource = map.current.getSource('sim-ml-heatmap-source');
    const contoursSource = map.current.getSource('sim-ml-contours-source');
    const wbGridSrc = map.current.getSource('sim-wb-grid-source');
    
    if (!heatmapSource || !contoursSource) return;

    if (mlSimulationData) {
      const isGrid = mlSimulationData.type === 'FeatureCollection';
      
      if (activeModule === 'heatwave') {
        // Heatwave uses contour fill/stroke rendering (same as landslide rainfall)
        // The contour data is fed via simulationResults.contour_geojson in the render effect above
        // Here we just need to clear the point heatmap sources
        heatmapSource.setData({ type: 'FeatureCollection', features: [] });
        contoursSource.setData({ type: 'FeatureCollection', features: [] });
        
        // Hide WB_GRID_FILL for heatwave
        if (map.current.getLayer(SIM_LAYERS.WB_GRID_FILL)) {
          map.current.setLayoutProperty(SIM_LAYERS.WB_GRID_FILL, 'visibility', 'none');
        }
        return;
      }

      // ── Landslide/Earthquake: Keep existing point heatmap behavior ──
      const features = isGrid 
        ? mlSimulationData.features.map(f => {
            const val = f.properties.hazard_probability ?? f.properties.fused_hazard ?? 0;
            return {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [f.properties.centroid_lon, f.properties.centroid_lat] },
              properties: { 
                intensity: val,
                intensity_normalized: val * 0.05
              }
            };
          })
          : (mlSimulationData.length > 0 ? mlSimulationData.map(pt => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [pt.lng, pt.lat] },
              properties: { 
                intensity: pt.intensity,
                intensity_normalized: pt.intensity
              }
            })) : []);

        if (features.length > 0) {
          const fc = { type: 'FeatureCollection', features };
          heatmapSource.setData(fc);

          try {
            const breaks = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
            const lines = isolines(fc, breaks, { zProperty: 'intensity' });
            contoursSource.setData(lines);
          } catch (err) {
            contoursSource.setData({ type: 'FeatureCollection', features: [] });
          }
        } else {
          heatmapSource.setData({ type: 'FeatureCollection', features: [] });
          contoursSource.setData({ type: 'FeatureCollection', features: [] });
        }
        
        // Hide the grid layer for heatmap mode
        if (wbGridSrc) wbGridSrc.setData({ type: 'FeatureCollection', features: [] });
        if (map.current.getLayer(SIM_LAYERS.WB_GRID_FILL)) {
          map.current.setLayoutProperty(SIM_LAYERS.WB_GRID_FILL, 'visibility', 'none');
        }
    } else {
      mapLayerManager.clearSourcesData(map.current, ['sim-ml-heatmap-source', 'sim-ml-contours-source']);
      if (wbGridSrc) wbGridSrc.setData({ type: 'FeatureCollection', features: [] });
      
      if (map.current.getLayer('sim-ml-heatmap-layer')) {
        map.current.setLayoutProperty('sim-ml-heatmap-layer', 'visibility', 'none');
      }
      if (map.current.getLayer('sim-ml-contours-layer')) {
        map.current.setLayoutProperty('sim-ml-contours-layer', 'visibility', 'none');
      }
      if (map.current.getLayer(SIM_LAYERS.WB_GRID_FILL)) {
        map.current.setLayoutProperty(SIM_LAYERS.WB_GRID_FILL, 'visibility', 'none');
      }
    }
  }, [mlSimulationData, isStyleLoaded, heatwaveActiveLayer, activeModule]);

  // Sync Dynamic Heatmap Colors
  useEffect(() => {
    if (!isStyleLoaded || !map.current) return;
    if (!mapLayerManager.layerExists(map.current, 'sim-ml-heatmap-layer')) return;

    const colorRamp = [
      'interpolate', ['linear'], ['heatmap-density'],
      0.0, 'rgba(16,185,129,0)',
      0.1, 'rgba(16,185,129,0.2)',
      0.3, '#10b981',
      0.5, '#eab308',
      0.7, '#f97316',
      0.9, '#ef4444'
    ];
    map.current.setPaintProperty('sim-ml-heatmap-layer', 'heatmap-color', colorRamp);
  }, [isStyleLoaded]);

  // Sync ML Layer Visibility
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
    
    // For heatwave, sync contour layers with mlHeatmapVisible toggle
    if (activeModule === 'heatwave') {
      if (mapLayerManager.layerExists(map.current, SIM_LAYERS.CONTOUR_FILL)) {
        map.current.setLayoutProperty(SIM_LAYERS.CONTOUR_FILL, 'visibility', mlHeatmapVisible ? 'visible' : 'none');
      }
      if (mapLayerManager.layerExists(map.current, SIM_LAYERS.CONTOUR_STROKE)) {
        map.current.setLayoutProperty(SIM_LAYERS.CONTOUR_STROKE, 'visibility', mlHeatmapVisible ? 'visible' : 'none');
      }
      if (mapLayerManager.layerExists(map.current, SIM_LAYERS.WB_GRID_FILL)) {
        map.current.setLayoutProperty(SIM_LAYERS.WB_GRID_FILL, 'visibility', 'none');
      }
    }
  }, [mlHeatmapVisible, mlContoursVisible, mlSimulationData, isStyleLoaded, activeModule]);

  // Automatically fetch and toggle Landslide Raster Layers
  useEffect(() => {
    if (!isStyleLoaded || !map.current || !rasterService) return;

    const handleRasterToggle = async (key, url) => {
      const layerId = `${key}-raster`;
      const isVisible = gisLayers[key] && activeModule === 'landslide';
      
      if (isVisible && !rasterService.rasterCache.has(layerId)) {
        try {
          await rasterService.addGeoTiffFromUrl(url, layerId, { 
            opacity: layerOpacities[key] || 0.8,
            onStateChange: (state) => useStore.getState().setRasterLoadingState(key, state),
            dataMin: key === 'slopeRisk' ? 0 : undefined,
            dataMax: key === 'slopeRisk' ? 2500 : undefined
          });
        } catch (e) {
          useStore.getState().setRasterLoadingState(key, 'failed');
        }
      } else if (rasterService.rasterCache.has(layerId)) {
        rasterService.updateVisibility(layerId, isVisible);
      }
    };

    handleRasterToggle('slopeRisk', '/rasters/slope_risk.tif');
    handleRasterToggle('soilMoisture', '/rasters/soil_moisture.tif');

  }, [gisLayers.slopeRisk, gisLayers.soilMoisture, activeModule, isStyleLoaded]);

  // Sync Landslide Historical Validation Points
  useEffect(() => {
    if (!isStyleLoaded || !map.current) return;
    
    const sourceId = 'landslide-validation-source';
    const layerId = 'landslide-validation-layer';
    
    // Check if the GIS Layers "Landslides" toggle is active AND we are in the landslide module
    const isVisible = gisLayers['landslides'] && activeModule === 'landslide';
    
    if (isVisible) {
      if (!mapLayerManager.sourceExists(map.current, sourceId)) {
        mapLayerManager.addSourceSafe(map.current, sourceId, {
          type: 'geojson',
          data: '/scientific-api/landslide/validation-points'
        });
        
        mapLayerManager.addLayerSafe(map.current, {
          id: layerId,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': 4,
            'circle-color': '#0ea5e9',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
          }
        });
      } else {
        if (map.current.getLayer(layerId)) {
          map.current.setLayoutProperty(layerId, 'visibility', 'visible');
        }
      }
    } else {
      if (mapLayerManager.layerExists(map.current, layerId)) {
        map.current.setLayoutProperty(layerId, 'visibility', 'none');
      }
    }
  }, [gisLayers, activeModule, isStyleLoaded]);

  return (
    <div className="absolute inset-0 z-0">
      <div ref={mapContainer} className={`w-full h-full ${useStore((state) => state.isPlacingEpicenter) ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`} />
      {/* Cinematic vignette overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-950/30 to-slate-950/90 mix-blend-multiply" />
    </div>
  );
}
