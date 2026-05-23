/**
 * server/src/socket/feedGenerator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Real-time earthquake feed generator via Socket.IO
 * Emits synthetic earthquake events at an interval.
 * ─────────────────────────────────────────────────────────────────────────────
 */

let feedInterval = null;

export function startFeed(params, io) {
  if (feedInterval) {
    clearInterval(feedInterval);
  }

  const {
    epicenter = { lat: 22.57, lng: 88.36 }, // Kolkata default
    magnitudeRange = [2.0, 6.0],
    depthRange = [5, 50],
    intervalMs = 2000
  } = params || {};

  console.log(`[Feed] Starting live earthquake feed every ${intervalMs}ms at ${epicenter.lat},${epicenter.lng}`);

  feedInterval = setInterval(() => {
    // Generate random magnitude and depth
    const magnitude = (Math.random() * (magnitudeRange[1] - magnitudeRange[0]) + magnitudeRange[0]);
    const depth = Math.floor(Math.random() * (depthRange[1] - depthRange[0]) + depthRange[0]);

    // Randomize position within ~200km radius of the base epicenter
    // 1 deg ≈ 111km
    const angle = Math.random() * Math.PI * 2;
    const distanceKm = Math.random() * 200;
    
    const dLat = (distanceKm * Math.sin(angle)) / 111;
    const dLng = (distanceKm * Math.cos(angle)) / (111 * Math.cos(epicenter.lat * Math.PI / 180));

    const lat = epicenter.lat + dLat;
    const lng = epicenter.lng + dLng;

    const feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {
        id: `eq-${Date.now()}`,
        magnitude: Math.round(magnitude * 10) / 10,
        depth,
        timestamp: new Date().toISOString(),
        type: 'earthquake'
      }
    };

    io.emit('earthquake:detected', feature);
  }, intervalMs);
}

export function stopFeed() {
  if (feedInterval) {
    clearInterval(feedInterval);
    feedInterval = null;
    console.log('[Feed] Live earthquake feed stopped.');
  }
}
