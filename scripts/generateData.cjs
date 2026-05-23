#!/usr/bin/env node
/**
 * scripts/generateData.cjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Developer utility: regenerates all GeoJSON mock data files in public/data/.
 * Run with: npm run generate-data
 *
 * WHY THIS EXISTS: The public/data/ GeoJSON files power the frontend map
 * layers when the backend is not running. When PostGIS is fully integrated,
 * this script will be replaced by API calls to the database seed endpoint.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');

// All data is centered on Kolkata, West Bengal, India
// Coordinates: 22.57°N, 88.36°E (WGS 84 / EPSG:4326)
const CENTER_LNG = 88.36;
const CENTER_LAT = 22.57;

// Output directory relative to project root
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');

function randomPoints(count, spread, propertiesFunc) {
  const features = [];
  for (let i = 0; i < count; i++) {
    const lng = CENTER_LNG + (Math.random() - 0.5) * spread;
    const lat = CENTER_LAT + (Math.random() - 0.5) * spread;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: propertiesFunc(i)
    });
  }
  return { type: 'FeatureCollection', features };
}

function writeDataFile(filename, data) {
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`  ✓ ${filename} (${data.features.length} features)`);
}

console.log('\nHazardMap — Generating mock GeoJSON data');
console.log(`  Center: ${CENTER_LAT}°N, ${CENTER_LNG}°E (Kolkata)\n`);

// Hospitals
const hospitals = randomPoints(60, 0.4, (i) => ({
  name: `Kolkata Hospital ${i + 1}`,
  type: 'hospital',
  capacity: Math.floor(Math.random() * 500) + 100,
  availableBeds: Math.floor(Math.random() * 50)
}));
writeDataFile('hospitals.geojson', hospitals);

// Shelters
const shelters = randomPoints(90, 0.5, (i) => ({
  name: `Shelter Station ${i + 1}`,
  type: 'shelter',
  capacity: Math.floor(Math.random() * 1000) + 200,
  occupancy: Math.floor(Math.random() * 500)
}));
writeDataFile('shelters.geojson', shelters);

// Buildings (used by the simulation damage engine)
const buildings = randomPoints(150, 0.35, (i) => ({
  name: `Building ${i + 1}`,
  type: ['residential', 'commercial', 'industrial', 'government'][Math.floor(Math.random() * 4)],
  floors: Math.floor(Math.random() * 20) + 1,
  yearBuilt: Math.floor(Math.random() * 60) + 1960
}));
writeDataFile('buildings.geojson', buildings);

// Historical epicenters (used for the seismic heatmap layer)
const epicenters = randomPoints(200, 1.2, (i) => ({
  magnitude: (Math.random() * 4 + 2).toFixed(1),
  depth: Math.floor(Math.random() * 30) + 5
}));
writeDataFile('epicenters.geojson', epicenters);

// Danger zones (pre-defined risk areas)
const dangerZones = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[88.30, 22.60], [88.38, 22.62], [88.42, 22.58], [88.36, 22.54], [88.30, 22.60]]]
      },
      properties: { riskLevel: 'high', type: 'liquefaction' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[88.40, 22.50], [88.48, 22.52], [88.50, 22.46], [88.42, 22.44], [88.40, 22.50]]]
      },
      properties: { riskLevel: 'critical', type: 'subsidence' }
    }
  ]
};
writeDataFile('danger-zones.geojson', dangerZones);

// Safe zones (assembly points and evacuation areas)
const safeZones = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[88.28, 22.54], [88.34, 22.54], [88.34, 22.50], [88.28, 22.50], [88.28, 22.54]]]
      },
      properties: { capacity: 5000, name: 'Maidan Safe Zone' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[88.44, 22.62], [88.50, 22.62], [88.50, 22.58], [88.44, 22.58], [88.44, 22.62]]]
      },
      properties: { capacity: 3000, name: 'Salt Lake Safe Zone' }
    }
  ]
};
writeDataFile('safe-zones.geojson', safeZones);

// Road network (major arteries, used by simulation + road layer)
const roads = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[88.30, 22.58], [88.34, 22.57], [88.38, 22.56], [88.42, 22.55], [88.46, 22.54]]
      },
      properties: { name: 'AJC Bose Road', status: 'clear', lanes: 4 }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[88.32, 22.62], [88.34, 22.59], [88.36, 22.56], [88.38, 22.53]]
      },
      properties: { name: 'Park Street Corridor', status: 'clear', lanes: 6 }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[88.36, 22.64], [88.40, 22.62], [88.44, 22.58], [88.46, 22.54]]
      },
      properties: { name: 'EM Bypass', status: 'clear', lanes: 8 }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[88.28, 22.56], [88.32, 22.54], [88.36, 22.52], [88.40, 22.50]]
      },
      properties: { name: 'Diamond Harbour Road', status: 'clear', lanes: 4 }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[88.34, 22.62], [88.38, 22.60], [88.42, 22.58], [88.46, 22.56], [88.50, 22.54]]
      },
      properties: { name: 'VIP Road', status: 'clear', lanes: 6 }
    }
  ]
};
writeDataFile('roads.geojson', roads);

console.log('\n✅ All mock data generated successfully.\n');
