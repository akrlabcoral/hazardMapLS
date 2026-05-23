/**
 * Converts a database row with PostGIS geometry into a GeoJSON Feature.
 * Assumes the geometry column is returned as GeoJSON text via ST_AsGeoJSON.
 */
export function rowToFeature(row, geometryColumn = 'geojson') {
  const { [geometryColumn]: geojson, ...properties } = row;
  return {
    type: 'Feature',
    geometry: JSON.parse(geojson),
    properties
  };
}

/**
 * Converts an array of database rows into a GeoJSON FeatureCollection.
 */
export function rowsToFeatureCollection(rows, geometryColumn = 'geojson') {
  return {
    type: 'FeatureCollection',
    features: rows.map(row => rowToFeature(row, geometryColumn))
  };
}
