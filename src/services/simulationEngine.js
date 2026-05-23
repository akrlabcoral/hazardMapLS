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
 * Generate concentric hazard zone GeoJSON polygons.
 */
export function generateHazardZones(epicenter, magnitude, depth) {
  const radii = calculateHazardRadii(magnitude, depth);
  const center = [epicenter.lng, epicenter.lat];

  const lightZone = {
    ...circle(center, radii.light, { units: 'kilometers', steps: 64 }),
    properties: { zone: 'light', radius: radii.light }
  };
  const moderateZone = {
    ...circle(center, radii.moderate, { units: 'kilometers', steps: 64 }),
    properties: { zone: 'moderate', radius: radii.moderate }
  };
  const severeZone = {
    ...circle(center, radii.severe, { units: 'kilometers', steps: 64 }),
    properties: { zone: 'severe', radius: radii.severe }
  };

  // Order: light first (bottom), then moderate, then severe (top)
  return {
    type: 'FeatureCollection',
    features: [lightZone, moderateZone, severeZone]
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
 * Generate aftershock points within the moderate hazard zone.
 */
export function generateAftershocks(epicenter, magnitude, depth) {
  const radii = calculateHazardRadii(magnitude, depth);
  const seed = Math.floor(magnitude * 1234 + depth * 56);
  const rng = seededRandom(seed);

  const count = Math.floor(rng() * 6) + 3; // 3-8 aftershocks
  const features = [];

  for (let i = 0; i < count; i++) {
    // Random position within moderate radius
    const angle = rng() * Math.PI * 2;
    const dist = rng() * radii.moderate;
    // Approximate degree offset (1 degree ≈ 111 km)
    const dLng = (dist * Math.cos(angle)) / (111 * Math.cos((epicenter.lat * Math.PI) / 180));
    const dLat = (dist * Math.sin(angle)) / 111;

    const afterMag = Math.max(1, magnitude - 1 - rng() * 2);

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [epicenter.lng + dLng, epicenter.lat + dLat]
      },
      properties: {
        magnitude: Math.round(afterMag * 10) / 10,
        type: 'aftershock'
      }
    });
  }

  return { type: 'FeatureCollection', features };
}

/**
 * Run the full simulation. Returns all results in a single object.
 */
export function runSimulation(epicenter, magnitude, depth, aftershocksEnabled, buildingsData, roadsData) {
  const hazardZones = generateHazardZones(epicenter, magnitude, depth);
  const damagedBuildings = simulateBuildingDamage(epicenter, magnitude, depth, buildingsData);
  const blockedRoads = simulateRoadBlockages(epicenter, magnitude, depth, roadsData);
  const aftershocks = aftershocksEnabled
    ? generateAftershocks(epicenter, magnitude, depth)
    : { type: 'FeatureCollection', features: [] };

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
    aftershocks,
    stats: {
      radii,
      buildings: { total: totalBuildings, destroyed, majorDamage, minorDamage, intact },
      roads: { total: totalRoads, blocked, clear: totalRoads - blocked },
      aftershockCount: aftershocks.features.length
    }
  };
}
