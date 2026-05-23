/**
 * server/src/config/db.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PostgreSQL + PostGIS connection pool.
 *
 * WHY A POOL: Database connections are expensive to create. A pool keeps N
 * connections alive and reuses them across requests, giving us low latency
 * under concurrent load without exhausting DB resources.
 *
 * POSTGIS READINESS:
 * This pool is already fully capable of executing PostGIS spatial queries.
 * The `postgis` extension is enabled in migrations/001_init.sql.
 * No special client configuration is needed — spatial functions like
 * ST_DWithin, ST_Buffer, ST_Intersects, and ST_AsGeoJSON work transparently
 * through this pool via standard SQL strings.
 *
 * FUTURE: For heavy raster processing (PostGIS Raster / ST_MapAlgebra),
 * consider a dedicated read-replica pool to isolate expensive operations
 * from OLTP queries on the primary.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Pool sizing guidance for a disaster-response API:
  //   max: 10  → safe default; increase for high concurrency (crisis events)
  //   idleTimeoutMillis: 30000 → release idle connections after 30s
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
  // Don't exit — let the pool recover and reconnect
});

pool.on('connect', () => {
  // Uncomment for verbose connection logging during development:
  // console.log('[DB] New client connected to PostgreSQL');
});

/**
 * Execute a parameterized SQL query against the pool.
 *
 * SECURITY: Always use parameterized queries ($1, $2, ...) — never
 * interpolate user input directly into SQL strings. This prevents
 * SQL injection attacks on spatial data endpoints.
 *
 * @param {string} text - SQL query with $N placeholders
 * @param {Array}  params - Values for placeholders (auto-escaped by pg)
 * @returns {Promise<pg.QueryResult>}
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Acquire a dedicated client for multi-statement transactions.
 * Always call client.release() in a finally block.
 *
 * FUTURE USE: Transaction safety is critical when persisting simulation
 * results — e.g., writing hazard_zones + blocked_roads atomically.
 *
 * @returns {Promise<pg.PoolClient>}
 */
export const getClient = () => pool.connect();

export default pool;
