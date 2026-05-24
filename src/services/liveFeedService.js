import useStore from '../store/useStore';
import heatmapModelData from '../data/earthquake_heatmap_model.json';

class LiveFeedService {
  constructor() {
    this.intervalId = null;
    this.decayIntervalId = null;
    this.activeEvents = [];
    
    // Configurable decay time (how long until an earthquake fully fades out)
    this.EVENT_LIFETIME_MS = 15000; // 15 seconds
    this.DECAY_RATE_MS = 100; // 10fps update rate for smooth fading
    this.heatmapModel = heatmapModelData.earthquake_heatmap_model;
  }

  /**
   * Starts the mock real-time ingestion stream.
   * @param {number} intervalMs - Poll frequency (how often an earthquake occurs)
   */
  startStream(intervalMs = 2000) {
    if (this.intervalId) return;
    
    console.log(`[LiveFeedService] Starting live stream at ${intervalMs}ms intervals.`);
    this.activeEvents = [];
    useStore.getState().clearLiveEarthquakes();

    // 1. Ingestion Loop: Automatically detect and project incoming earthquake events
    this.intervalId = setInterval(() => {
      const newEvent = this.generateMockEarthquake();
      this.activeEvents.push(newEvent);
      
      // Update store counters & UI info
      const store = useStore.getState();
      store.setProcessedPointsCount(store.processedPointsCount + 1);
      store.setLastDetectedEarthquake({
        lat: newEvent.lat,
        lng: newEvent.lng,
        magnitude: newEvent.magnitude,
        depth: newEvent.depth,
        timestamp: newEvent.timestamp,
        intensityRadius: newEvent.intensityRadius
      });
      
    }, intervalMs);

    // 2. Decay Loop: Smoothly fade older events dynamically over time
    this.decayIntervalId = setInterval(() => {
      const now = Date.now();
      let hasChanges = false;
      
      this.activeEvents = this.activeEvents.filter(ev => {
        const age = now - ev.timestamp;
        
        // If event exceeds its lifetime, remove it completely from the map
        if (age >= this.EVENT_LIFETIME_MS) {
          hasChanges = true;
          return false;
        }
        
        // Calculate the fading currentIntensity (starts at full magnitude, decays to 0)
        // Using an easing function (e.g. cubic or linear)
        const progress = age / this.EVENT_LIFETIME_MS;
        const newIntensity = ev.magnitude * (1 - Math.pow(progress, 1.5)); // Slight cubic ease-out
        
        // Only trigger update if it changed significantly to save CPU, but for smooth fade we update often
        if (Math.abs(ev.currentIntensity - newIntensity) > 0.05) {
          ev.currentIntensity = newIntensity;
          hasChanges = true;
        }
        
        return true;
      });

      // Project the updated heatmaps to the MapLibre layer via store
      if (hasChanges) {
        this.updateStore();
      }
      
    }, this.DECAY_RATE_MS);
  }

  /**
   * Stops the live stream and clears intervals.
   */
  stopStream() {
    if (!this.intervalId) return;
    
    console.log('[LiveFeedService] Stopping live stream...');
    clearInterval(this.intervalId);
    clearInterval(this.decayIntervalId);
    this.intervalId = null;
    this.decayIntervalId = null;
  }

  /**
   * Generates a random simulated earthquake event anywhere in the world.
   * Looks up the realistic impact radius from the user-provided JSON model.
   */
  generateMockEarthquake() {
    const lat = (Math.random() * 140) - 70; // Avoid extreme poles for realism
    const lng = (Math.random() * 360) - 180;
    
    // Heavily weight towards lower magnitudes for realism, occasionally spiking to high magnitude
    let magnitude = (Math.random() * 3) + 2; // Base 2.0 - 5.0
    if (Math.random() > 0.9) magnitude += Math.random() * 3; // 10% chance to jump to 5.0 - 8.0
    if (Math.random() > 0.98) magnitude += Math.random() * 2; // 2% chance for 8.0 - 10.0
    
    // Round to 1 decimal place
    magnitude = Math.round(magnitude * 10) / 10;
    
    // Depth 5km - 100km
    const depth = Math.floor(Math.random() * 95) + 5;
    
    // Find the nearest magnitude in the JSON model to get the outer boundary (blue zone)
    const roundedMag = Math.max(1, Math.min(10, Math.round(magnitude)));
    const modelEntry = this.heatmapModel.magnitudes.find(m => m.magnitude === roundedMag);
    const intensityRadius = modelEntry ? modelEntry.zones_km.blue : 50;

    return {
      id: Math.random().toString(36).substring(2, 9),
      lat,
      lng,
      magnitude,
      depth,
      timestamp: Date.now(),
      currentIntensity: magnitude, // Starts at full magnitude
      intensityRadius
    };
  }

  /**
   * Translates active events into GeoJSON features for MapLibre rendering.
   */
  updateStore() {
    const features = this.activeEvents.map(ev => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [ev.lng, ev.lat]
      },
      properties: {
        id: ev.id,
        magnitude: ev.magnitude,
        currentIntensity: ev.currentIntensity, // This property drives the MapLibre heatmap weight!
        intensityRadius: ev.intensityRadius
      }
    }));
    
    useStore.getState().setLiveEarthquakes(features);
  }
}

export const liveFeedService = new LiveFeedService();
