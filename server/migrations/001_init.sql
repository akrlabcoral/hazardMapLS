-- HazardMap Database Schema
-- Requires PostGIS extension

CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- Shelters
-- ============================================
CREATE TABLE IF NOT EXISTS shelters (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  capacity      INTEGER DEFAULT 0,
  occupancy     INTEGER DEFAULT 0,
  status        VARCHAR(50) DEFAULT 'open',
  geom          GEOMETRY(Point, 4326) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shelters_geom ON shelters USING GIST (geom);

-- ============================================
-- Hospitals
-- ============================================
CREATE TABLE IF NOT EXISTS hospitals (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  capacity        INTEGER DEFAULT 0,
  available_beds  INTEGER DEFAULT 0,
  emergency_level VARCHAR(50) DEFAULT 'normal',
  geom            GEOMETRY(Point, 4326) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hospitals_geom ON hospitals USING GIST (geom);

-- ============================================
-- Incidents (earthquakes, aftershocks, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS incidents (
  id          SERIAL PRIMARY KEY,
  type        VARCHAR(100) NOT NULL DEFAULT 'earthquake',
  magnitude   NUMERIC(3,1),
  depth       NUMERIC(6,1),
  description TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  geom        GEOMETRY(Point, 4326) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_geom ON incidents USING GIST (geom);
CREATE INDEX idx_incidents_type ON incidents (type);

-- ============================================
-- Blocked Roads
-- ============================================
CREATE TABLE IF NOT EXISTS blocked_roads (
  id          SERIAL PRIMARY KEY,
  road_name   VARCHAR(255) NOT NULL,
  blocked     BOOLEAN DEFAULT FALSE,
  reason      TEXT,
  lanes       INTEGER DEFAULT 2,
  geom        GEOMETRY(LineString, 4326) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blocked_roads_geom ON blocked_roads USING GIST (geom);

-- ============================================
-- Rescue Teams
-- ============================================
CREATE TABLE IF NOT EXISTS rescue_teams (
  id             SERIAL PRIMARY KEY,
  team_name      VARCHAR(255) NOT NULL,
  status         VARCHAR(50) DEFAULT 'standby',
  members_count  INTEGER DEFAULT 0,
  specialization VARCHAR(100),
  geom           GEOMETRY(Point, 4326) NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rescue_teams_geom ON rescue_teams USING GIST (geom);

-- ============================================
-- Hazard Zones
-- ============================================
CREATE TABLE IF NOT EXISTS hazard_zones (
  id          SERIAL PRIMARY KEY,
  zone_type   VARCHAR(50) NOT NULL,   -- 'severe', 'moderate', 'light'
  risk_level  VARCHAR(50),            -- 'critical', 'high', 'medium', 'low'
  description TEXT,
  geom        GEOMETRY(Polygon, 4326) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hazard_zones_geom ON hazard_zones USING GIST (geom);
