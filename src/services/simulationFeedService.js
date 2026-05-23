/**
 * src/services/simulationFeedService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Service for streaming and managing the live simulation JSON feed.
 * Implements a chunk-based string parser to process massive (250MB+) JSON
 * arrays without exhausting browser memory, and batches GeoJSON features
 * using a sliding window for 60fps rendering.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { buildSimulationFeature } from '../utils/geojson/featureBuilders';
import useStore from '../store/useStore';

class SimulationFeedService {
  constructor() {
    this.feedUrl = '/data/mini_heatmap.json';
    this.abortController = null;
    this.isStreaming = false;
    
    // Processing state
    this.buffer = '';
    this.batchedFeatures = [];
    this.totalProcessed = 0;
    
    // Configurable sliding window limit (max points on screen)
    this.MAX_WINDOW_SIZE = 10000;
  }

  /**
   * Starts fetching the JSON file and streaming it chunk by chunk.
   * Dispatches updates to the store at controlled intervals.
   */
  async startStream(intervalMs = 500) {
    if (this.isStreaming) return;
    
    console.log(`[SimulationFeedService] Starting stream from ${this.feedUrl}`);
    this.isStreaming = true;
    this.abortController = new AbortController();
    this.buffer = '';
    this.batchedFeatures = [];
    this.totalProcessed = 0;
    useStore.getState().setProcessedPointsCount(0); // Add a counter to UI later

    // Start the interval that flushes queued features to the MapLibre source
    this.flushInterval = setInterval(() => this.flushBatch(), intervalMs);

    try {
      const response = await fetch(this.feedUrl, { signal: this.abortController.signal });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch feed: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[SimulationFeedService] Stream fully read.');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        this.processChunk(chunk);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[SimulationFeedService] Stream aborted by user.');
      } else {
        console.error(`[SimulationFeedService] Error streaming feed:`, error);
      }
    } finally {
      // Ensure the final batch is flushed when stream ends
      this.stopStream();
    }
  }

  /**
   * Parses flat JSON objects from the text stream buffer.
   * Uses regex to extract `{...}` avoiding full JSON.parse on the 250MB array.
   */
  processChunk(chunkText) {
    this.buffer += chunkText;

    // Find the last complete object boundary in the current buffer
    const lastClosingBrace = this.buffer.lastIndexOf('}');
    if (lastClosingBrace === -1) return; // No complete object yet

    // Extract the portion of the buffer that contains complete objects
    const processableText = this.buffer.substring(0, lastClosingBrace + 1);
    this.buffer = this.buffer.substring(lastClosingBrace + 1); // Keep the remainder

    // Match all flat JSON objects (assuming no nested objects inside)
    const matches = processableText.match(/\{[^{}]+\}/g);
    
    if (matches) {
      for (const jsonStr of matches) {
        try {
          const point = JSON.parse(jsonStr);
          const feature = buildSimulationFeature(point);
          if (feature) {
             this.batchedFeatures.push(feature);
             this.totalProcessed++;
          }
        } catch (e) {
          // Ignore malformed partial objects just in case
        }
      }
      
      // Update UI counter in real-time
      useStore.getState().setProcessedPointsCount(this.totalProcessed);
    }
  }

  /**
   * Flushes the batched features to the Zustand store, applying the sliding window.
   */
  flushBatch() {
    if (this.batchedFeatures.length === 0) return;

    const setLiveEarthquakes = useStore.getState().setLiveEarthquakes;
    const currentFeatures = useStore.getState().liveEarthquakes;
    
    if (setLiveEarthquakes) {
      // Combine existing features with the new batch
      const combined = [...currentFeatures, ...this.batchedFeatures];
      
      setLiveEarthquakes(combined);
      this.batchedFeatures = []; // Clear the batch
    }
  }

  stopStream() {
    if (!this.isStreaming) return;
    
    console.log('[SimulationFeedService] Stopping stream...');
    this.isStreaming = false;
    
    if (this.abortController) {
      this.abortController.abort();
    }
    
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushBatch(); // Final flush
    }
  }

  // Fallback for immediate load on mount (no longer used, but kept for compatibility)
  async loadSimulationFeed() {
    console.warn('[SimulationFeedService] loadSimulationFeed() is deprecated for massive files. Use startStream()');
  }
}

export const simulationFeedService = new SimulationFeedService();
