export const fetchGeoJson = async (filename) => {
  try {
    let url = `/data/${filename}`;

    // Map specific files to API endpoints if the backend is running
    if (filename === 'hospitals.geojson') url = '/api/hospitals';
    if (filename === 'shelters.geojson') url = '/api/shelters';
    if (filename === 'epicenters.geojson') url = '/api/earthquakes';

    const response = await fetch(url);
    if (!response.ok) {
      if (url.startsWith('/api')) {
        console.warn(`[API] Failed to fetch ${url}, falling back to static ${filename}...`);
        const fallbackResponse = await fetch(`/data/${filename}`);
        if (!fallbackResponse.ok) throw new Error(`Fallback failed for ${filename}`);
        return await fallbackResponse.json();
      }
      throw new Error(`Failed to fetch ${filename}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return { type: 'FeatureCollection', features: [] };
  }
};
