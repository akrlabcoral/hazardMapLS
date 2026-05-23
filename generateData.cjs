const fs = require('fs');

const CENTER_LNG = 88.36;
const CENTER_LAT = 22.57;

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

// Generate Hospitals around Kolkata
const hospitals = randomPoints(60, 0.4, (i) => ({
  name: `Kolkata Hospital ${i + 1}`,
  type: 'hospital',
  capacity: Math.floor(Math.random() * 500) + 100,
  availableBeds: Math.floor(Math.random() * 50)
}));
fs.writeFileSync('public/data/hospitals.geojson', JSON.stringify(hospitals));

// Generate Shelters around Kolkata
const shelters = randomPoints(90, 0.5, (i) => ({
  name: `Shelter Station ${i + 1}`,
  type: 'shelter',
  capacity: Math.floor(Math.random() * 1000) + 200,
  occupancy: Math.floor(Math.random() * 500)
}));
fs.writeFileSync('public/data/shelters.geojson', JSON.stringify(shelters));

// Generate Historical Epicenters (for heatmap)
const epicenters = randomPoints(200, 1.2, (i) => ({
  magnitude: (Math.random() * 4 + 2).toFixed(1),
  depth: Math.floor(Math.random() * 30) + 5
}));
fs.writeFileSync('public/data/epicenters.geojson', JSON.stringify(epicenters));

// Generate Buildings (for damage simulation)
const buildings = randomPoints(150, 0.35, (i) => ({
  name: `Building ${i + 1}`,
  type: ['residential', 'commercial', 'industrial', 'government'][Math.floor(Math.random() * 4)],
  floors: Math.floor(Math.random() * 20) + 1,
  yearBuilt: Math.floor(Math.random() * 60) + 1960
}));
fs.writeFileSync('public/data/buildings.geojson', JSON.stringify(buildings));

// Generate Danger Zones around Kolkata
const dangerZones = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [88.30, 22.60], [88.38, 22.62], [88.42, 22.58], [88.36, 22.54], [88.30, 22.60]
        ]]
      },
      properties: { riskLevel: 'high', type: 'liquefaction' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [88.40, 22.50], [88.48, 22.52], [88.50, 22.46], [88.42, 22.44], [88.40, 22.50]
        ]]
      },
      properties: { riskLevel: 'critical', type: 'subsidence' }
    }
  ]
};
fs.writeFileSync('public/data/danger-zones.geojson', JSON.stringify(dangerZones));

// Generate Safe Zones around Kolkata
const safeZones = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [88.28, 22.54], [88.34, 22.54], [88.34, 22.50], [88.28, 22.50], [88.28, 22.54]
        ]]
      },
      properties: { capacity: 5000, name: 'Maidan Safe Zone' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [88.44, 22.62], [88.50, 22.62], [88.50, 22.58], [88.44, 22.58], [88.44, 22.62]
        ]]
      },
      properties: { capacity: 3000, name: 'Salt Lake Safe Zone' }
    }
  ]
};
fs.writeFileSync('public/data/safe-zones.geojson', JSON.stringify(safeZones));

// Generate Roads (major arteries around Kolkata)
const roads = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [88.30, 22.58], [88.34, 22.57], [88.38, 22.56], [88.42, 22.55], [88.46, 22.54]
        ]
      },
      properties: { name: 'AJC Bose Road', status: 'clear', lanes: 4 }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [88.32, 22.62], [88.34, 22.59], [88.36, 22.56], [88.38, 22.53]
        ]
      },
      properties: { name: 'Park Street Corridor', status: 'clear', lanes: 6 }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [88.36, 22.64], [88.40, 22.62], [88.44, 22.58], [88.46, 22.54]
        ]
      },
      properties: { name: 'EM Bypass', status: 'clear', lanes: 8 }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [88.28, 22.56], [88.32, 22.54], [88.36, 22.52], [88.40, 22.50]
        ]
      },
      properties: { name: 'Diamond Harbour Road', status: 'clear', lanes: 4 }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [88.34, 22.62], [88.38, 22.60], [88.42, 22.58], [88.46, 22.56], [88.50, 22.54]
        ]
      },
      properties: { name: 'VIP Road', status: 'clear', lanes: 6 }
    }
  ]
};
fs.writeFileSync('public/data/roads.geojson', JSON.stringify(roads));

console.log('Mock GeoJSON data regenerated around Kolkata successfully.');
