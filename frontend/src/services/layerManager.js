// Static layer configurations for MapLibre

export const LAYER_CONFIGS = {
  indiaBoundary: {
    sourceId: 'india-boundary-source',
    dataUrl: 'india_boundary.geojson',
    layers: [
      {
        id: 'india-boundary-fill',
        type: 'fill',
        source: 'india-boundary-source',
        beforeId: 'sim-wb-grid-fill', // Explicitly place beneath simulation layers
        paint: {
          'fill-color': '#0f172a',
          'fill-opacity': 0.08
        }
      },
      {
        id: 'india-boundary-line',
        type: 'line',
        source: 'india-boundary-source',
        beforeId: 'sim-wb-grid-fill', // Explicitly place beneath simulation layers
        paint: {
          'line-color': '#00d4ff',
          'line-width': 1.5,
          'line-opacity': 0.6
        }
      }
    ]
  },
  stateBoundaries: {
    sourceId: 'state-boundaries-source',
    dataUrl: 'india_states.geojson',
    layers: [
      {
        id: 'state-boundaries-fill',
        type: 'fill',
        source: 'state-boundaries-source',
        beforeId: 'sim-wb-grid-fill',
        paint: {
          'fill-color': '#0ea5e9',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.1, // Slight glow on hover
            0.0 // Transparent otherwise
          ]
        }
      },
      {
        id: 'state-boundaries-line',
        type: 'line',
        source: 'state-boundaries-source',
        beforeId: 'sim-wb-grid-fill',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#0ea5e9', // Bright neon blue when hovered
            '#00d4ff'  // Default cyan
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3.0,
            1.5
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1.0,
            0.6
          ]
        }
      }
    ]
  },
  hospitals: {
    sourceId: 'hospitals-source',
    dataUrl: 'hospitals.geojson',
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
    layers: [
      {
        id: 'hospitals-clusters',
        type: 'circle',
        source: 'hospitals-source',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#06b6d4', 10, '#3b82f6', 50, '#1d4ed8'],
          'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 50, 30],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      },
      {
        id: 'hospitals-cluster-count',
        type: 'symbol',
        source: 'hospitals-source',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: { 'text-color': '#ffffff' }
      },
      {
        id: 'hospitals-points',
        type: 'circle',
        source: 'hospitals-source',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 6,
          'circle-color': '#06b6d4',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      }
    ]
  },
  shelters: {
    sourceId: 'shelters-source',
    dataUrl: 'shelters.geojson',
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
    layers: [
      {
        id: 'shelters-clusters',
        type: 'circle',
        source: 'shelters-source',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#10b981', 10, '#059669', 50, '#047857'],
          'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 50, 30],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      },
      {
        id: 'shelters-cluster-count',
        type: 'symbol',
        source: 'shelters-source',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: { 'text-color': '#ffffff' }
      },
      {
        id: 'shelters-points',
        type: 'circle',
        source: 'shelters-source',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 6,
          'circle-color': '#10b981',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      }
    ]
  },
  heatmaps: {
    sourceId: 'heatmaps-source',
    dataUrl: 'epicenters.geojson',
    layers: [
      {
        id: 'epicenters-heatmap',
        type: 'heatmap',
        source: 'heatmaps-source',
        maxzoom: 9,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['to-number', ['get', 'magnitude']], 0, 0, 10, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
          // Premium cinematic color ramp — 9-stop gradient matching MapView heatmap
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,    'rgba(0,0,255,0)',
            0.1,  'rgba(0,80,255,0.4)',
            0.2,  'rgba(0,180,255,0.6)',
            0.35, 'rgba(0,255,128,0.7)',
            0.5,  'rgba(255,255,0,0.75)',
            0.65, 'rgba(255,180,0,0.8)',
            0.8,  'rgba(255,80,0,0.85)',
            0.9,  'rgba(255,20,0,0.9)',
            1,    'rgba(200,0,0,0.95)'
          ],
          // Larger radius for smoother Gaussian blending at all zoom levels
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 9, 25],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0]
        }
      },
      {
        id: 'epicenters-point',
        type: 'circle',
        source: 'heatmaps-source',
        minzoom: 7,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, ['interpolate', ['linear'], ['to-number', ['get', 'magnitude']], 1, 1, 10, 4], 16, ['interpolate', ['linear'], ['to-number', ['get', 'magnitude']], 1, 5, 10, 50]],
          'circle-color': '#ef4444',
          'circle-stroke-color': 'white',
          'circle-stroke-width': 1,
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 8, 1]
        }
      }
    ]
  },
  dangerZones: {
    sourceId: 'danger-zones-source',
    dataUrl: 'danger-zones.geojson',
    layers: [
      {
        id: 'danger-zones-fill',
        type: 'fill',
        source: 'danger-zones-source',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.4
        }
      },
      {
        id: 'danger-zones-line',
        type: 'line',
        source: 'danger-zones-source',
        paint: {
          'line-color': '#ef4444',
          'line-width': 2
        }
      }
    ]
  },
  safeZones: {
    sourceId: 'safe-zones-source',
    dataUrl: 'safe-zones.geojson',
    layers: [
      {
        id: 'safe-zones-fill',
        type: 'fill',
        source: 'safe-zones-source',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.4
        }
      },
      {
        id: 'safe-zones-line',
        type: 'line',
        source: 'safe-zones-source',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      }
    ]
  },
  roads: {
    sourceId: 'roads-source',
    dataUrl: 'roads.geojson',
    layers: [
      {
        id: 'roads-line',
        type: 'line',
        source: 'roads-source',
        paint: {
          'line-color': ['match', ['get', 'status'], 'clear', '#10b981', 'congested', '#f59e0b', '#3b82f6'],
          'line-width': 4,
          'line-opacity': 0.8
        }
      }
    ]
  },
  landslides: {          
    sourceId: 'landslides-source',
    dataUrl: 'india_landslides_NASA_GSI.geojson',
    layers: [
      {
        id: 'landslides-circles',
        type: 'circle',
        source: 'landslides-source',
        paint: {
          'circle-color': [
            'match', ['get', 'severity'],
            'Very High', '#dc2626',
            'High',      '#f97316',
            'Moderate',  '#eab308',
            '#22c55e'
          ],
          'circle-radius': [
            'interpolate', ['linear'],
            ['get', 'deaths'],
              0,    5,
              100,  10,
              5748, 22
          ],
          'circle-opacity': 0.85,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5
        }
      }
    ]
  }
  
};

// Raster layer configs (no GeoJSON)
export const RASTER_CONFIGS = {
  satellite: {
    sourceId: 'satellite-source',
    type: 'raster',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    tileSize: 256,
    layers: [
      {
        id: 'satellite-layer',
        type: 'raster',
        source: 'satellite-source',
        minzoom: 0,
        maxzoom: 22,
        paint: { 'raster-opacity': 1 }
      }
    ]
  },
  terrain: {
    sourceId: 'terrain-source',
    type: 'raster',
    tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
    tileSize: 256,
    layers: [
      {
        id: 'terrain-layer',
        type: 'raster',
        source: 'terrain-source',
        minzoom: 0,
        maxzoom: 17,
        paint: { 'raster-opacity': 1 }
      }
    ]
  }
};
