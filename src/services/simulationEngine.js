// src/services/simulationEngine.js
// Client-side earthquake simulation engine with distance-based damage model

import circle from '@turf/circle';

/**
 * Seeded pseudo-random number generator for deterministic results.
 * Same seed always produces the same sequence.
 */
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Calculate distance in km between two [lng, lat] points using Haversine formula.
 */
export function haversineDistance(coord1, coord2) {
  const R = 6371; // Earth radius in km
  const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const dLng = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((coord1[1] * Math.PI) / 180) *
      Math.cos((coord2[1] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculate hazard zone radii based on magnitude and depth.
 * Returns { severe, moderate, light } in kilometers.
 */
export function calculateHazardRadii(magnitude, depth) {
  // Simplified attenuation model: deeper quakes are less intense at surface
  const depthFactor = 1 / (1 + depth / 50);
  const severeRadius = Math.pow(10, 0.5 * magnitude - 1.8) * depthFactor;
  const moderateRadius = severeRadius * 2;
  const lightRadius = severeRadius * 3.5;
  return {
    severe: Math.max(severeRadius, 0.5),
    moderate: Math.max(moderateRadius, 1),
    light: Math.max(lightRadius, 2)
  };
}

/**
 * Generate concentric hazard zone points for realistic Gaussian heatmap visualization.
 */
export function generateHazardZones(epicenter, magnitude, depth) {
  const radii = calculateHazardRadii(magnitude, depth);
  const maxRadius = radii.light;
  const center = [epicenter.lng, epicenter.lat];
  const features = [];
  
  // Set sigma for Gaussian decay to distribute 0-20% red, 20-40% orange, etc.
  const sigma = maxRadius * 0.35;
  
  // Calculate a step size so we generate a reasonably dense grid (e.g., ~25 radial steps)
  const stepKm = Math.max(0.5, maxRadius / 25);
  
  const R = 6371; // Earth radius in km
  const lat1 = center[1] * Math.PI / 180;
  const lon1 = center[0] * Math.PI / 180;

  for (let r = 0; r <= maxRadius; r += stepKm) {
    if (r === 0) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: center },
        properties: { intensity: 1.0 }
      });
      continue;
    }
    
    // Number of points in this ring based on circumference to keep point density consistent
    const circumference = 2 * Math.PI * r;
    const numPoints = Math.max(8, Math.floor(circumference / stepKm));
    
    // Gaussian attenuation formula
    const intensity = Math.exp(-(r * r) / (2 * sigma * sigma));
    
    // Optimize: Ignore extremely faded outer points
    if (intensity < 0.01) continue;
    
    for (let i = 0; i < numPoints; i++) {
      const bearing = (i / numPoints) * 360;
      const brng = bearing * Math.PI / 180;
      
      const lat2 = Math.asin(Math.sin(lat1) * Math.cos(r / R) +
                             Math.cos(lat1) * Math.sin(r / R) * Math.cos(brng));
      const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(r / R) * Math.cos(lat1),
                                     Math.cos(r / R) - Math.sin(lat1) * Math.sin(lat2));
      
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon2 * 180 / Math.PI, lat2 * 180 / Math.PI] },
        properties: { intensity }
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Simulate building damage using probabilistic distance-based model.
 * P(damage) = e^(-distance / severeRadius) adjusted by magnitude.
 */
export function simulateBuildingDamage(epicenter, magnitude, depth, buildingsGeoJson) {
  const radii = calculateHazardRadii(magnitude, depth);
  const center = [epicenter.lng, epicenter.lat];
  const seed = Math.floor(magnitude * 1000 + depth * 100);
  const rng = seededRandom(seed);

  const features = buildingsGeoJson.features.map((feature, idx) => {
    const coords = feature.geometry.coordinates;
    const distance = haversineDistance(center, coords);

    // Probability of damage decays exponentially with distance
    const damageProb = Math.exp(-distance / radii.severe);
    const roll = rng();

    let damageLevel = 'intact';
    if (roll < damageProb * 0.3) {
      damageLevel = 'destroyed';
    } else if (roll < damageProb * 0.6) {
      damageLevel = 'major';
    } else if (roll < damageProb) {
      damageLevel = 'minor';
    }

    return {
      ...feature,
      properties: {
        ...feature.properties,
        damageLevel,
        damageProb: Math.round(damageProb * 100),
        distanceFromEpicenter: Math.round(distance * 10) / 10
      }
    };
  });

  return { type: 'FeatureCollection', features };
}

/**
 * Simulate road blockages based on distance from epicenter.
 */
export function simulateRoadBlockages(epicenter, magnitude, depth, roadsGeoJson) {
  const radii = calculateHazardRadii(magnitude, depth);
  const center = [epicenter.lng, epicenter.lat];
  const seed = Math.floor(magnitude * 1000 + depth * 100 + 7);
  const rng = seededRandom(seed);

  const features = roadsGeoJson.features.map((feature) => {
    // Use the midpoint of the road for distance calculation
    const coords = feature.geometry.coordinates;
    const midIdx = Math.floor(coords.length / 2);
    const midpoint = coords[midIdx];
    const distance = haversineDistance(center, midpoint);

    const blockProb = Math.exp(-distance / radii.moderate);
    const blocked = rng() < blockProb;

    return {
      ...feature,
      properties: {
        ...feature.properties,
        blocked,
        blockProb: Math.round(blockProb * 100),
        status: blocked ? 'blocked' : 'clear'
      }
    };
  });

  return { type: 'FeatureCollection', features };
}



/**
 * Run the full simulation. Returns all results in a single object.
 */
export function runSimulation(epicenter, magnitude, depth, buildingsData, roadsData) {
  const hazardZones = generateHazardZones(epicenter, magnitude, depth);
  const damagedBuildings = simulateBuildingDamage(epicenter, magnitude, depth, buildingsData);
  const blockedRoads = simulateRoadBlockages(epicenter, magnitude, depth, roadsData);

  // Compute stats
  const totalBuildings = damagedBuildings.features.length;
  const destroyed = damagedBuildings.features.filter(f => f.properties.damageLevel === 'destroyed').length;
  const majorDamage = damagedBuildings.features.filter(f => f.properties.damageLevel === 'major').length;
  const minorDamage = damagedBuildings.features.filter(f => f.properties.damageLevel === 'minor').length;
  const intact = damagedBuildings.features.filter(f => f.properties.damageLevel === 'intact').length;

  const totalRoads = blockedRoads.features.length;
  const blocked = blockedRoads.features.filter(f => f.properties.blocked).length;

  const radii = calculateHazardRadii(magnitude, depth);

  return {
    hazardZones,
    damagedBuildings,
    blockedRoads,
    stats: {
      radii,
      buildings: { total: totalBuildings, destroyed, majorDamage, minorDamage, intact },
      roads: { total: totalRoads, blocked, clear: totalRoads - blocked }
    }
  };
}
