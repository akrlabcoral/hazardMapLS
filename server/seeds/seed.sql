-- HazardMap Seed Data — Kolkata Area (22.57°N, 88.36°E)

-- ============================================
-- Shelters (around Kolkata)
-- ============================================
INSERT INTO shelters (name, capacity, occupancy, status, geom) VALUES
('Maidan Relief Camp', 2000, 150, 'open', ST_SetSRID(ST_MakePoint(88.3420, 22.5530), 4326)),
('Salt Lake Shelter', 1500, 300, 'open', ST_SetSRID(ST_MakePoint(88.4100, 22.5850), 4326)),
('Howrah Station Camp', 3000, 800, 'open', ST_SetSRID(ST_MakePoint(88.3425, 22.5855), 4326)),
('Rajarhat Community Hall', 1000, 50, 'open', ST_SetSRID(ST_MakePoint(88.4530, 22.6210), 4326)),
('Jadavpur University Ground', 1200, 200, 'open', ST_SetSRID(ST_MakePoint(88.3695, 22.4993), 4326)),
('Behala Sports Complex', 800, 100, 'open', ST_SetSRID(ST_MakePoint(88.3200, 22.4910), 4326)),
('New Town Convention Centre', 2500, 0, 'open', ST_SetSRID(ST_MakePoint(88.4640, 22.5920), 4326)),
('Barrackpore Cantonment', 1800, 400, 'open', ST_SetSRID(ST_MakePoint(88.3770, 22.7640), 4326)),
('Dum Dum Park Shelter', 900, 120, 'open', ST_SetSRID(ST_MakePoint(88.4200, 22.6320), 4326)),
('Tollygunge Grounds', 1100, 80, 'open', ST_SetSRID(ST_MakePoint(88.3480, 22.4860), 4326));

-- ============================================
-- Hospitals
-- ============================================
INSERT INTO hospitals (name, capacity, available_beds, emergency_level, geom) VALUES
('SSKM Hospital', 800, 50, 'high', ST_SetSRID(ST_MakePoint(88.3432, 22.5397), 4326)),
('RG Kar Medical College', 600, 30, 'high', ST_SetSRID(ST_MakePoint(88.3650, 22.5920), 4326)),
('NRS Medical College', 700, 45, 'normal', ST_SetSRID(ST_MakePoint(88.3600, 22.5650), 4326)),
('AMRI Hospital Salt Lake', 400, 80, 'normal', ST_SetSRID(ST_MakePoint(88.4050, 22.5770), 4326)),
('Apollo Gleneagles', 500, 100, 'normal', ST_SetSRID(ST_MakePoint(88.3997, 22.5180), 4326)),
('Fortis Hospital Anandapur', 350, 60, 'normal', ST_SetSRID(ST_MakePoint(88.4120, 22.5100), 4326)),
('Calcutta Medical College', 900, 20, 'critical', ST_SetSRID(ST_MakePoint(88.3630, 22.5730), 4326)),
('Belle Vue Clinic', 250, 40, 'normal', ST_SetSRID(ST_MakePoint(88.3490, 22.5320), 4326)),
('Woodlands Hospital', 300, 55, 'normal', ST_SetSRID(ST_MakePoint(88.3440, 22.5230), 4326)),
('Medica Superspecialty', 450, 70, 'normal', ST_SetSRID(ST_MakePoint(88.3900, 22.5480), 4326));

-- ============================================
-- Incidents (historical earthquake events)
-- ============================================
INSERT INTO incidents (type, magnitude, depth, description, occurred_at, geom) VALUES
('earthquake', 5.2, 15.0, 'Moderate earthquake felt in Kolkata metro area', '2025-03-15 04:30:00+05:30', ST_SetSRID(ST_MakePoint(88.38, 22.58), 4326)),
('earthquake', 3.8, 25.0, 'Minor tremor near Salt Lake', '2025-06-20 14:12:00+05:30', ST_SetSRID(ST_MakePoint(88.42, 22.60), 4326)),
('earthquake', 4.5, 10.0, 'Earthquake centered near Howrah', '2025-09-01 22:45:00+05:30', ST_SetSRID(ST_MakePoint(88.31, 22.56), 4326)),
('earthquake', 6.1, 8.0, 'Significant earthquake causing structural damage', '2025-11-10 03:20:00+05:30', ST_SetSRID(ST_MakePoint(88.35, 22.55), 4326)),
('aftershock', 3.2, 12.0, 'Aftershock following Nov 10 event', '2025-11-10 04:05:00+05:30', ST_SetSRID(ST_MakePoint(88.36, 22.54), 4326));

-- ============================================
-- Blocked Roads
-- ============================================
INSERT INTO blocked_roads (road_name, blocked, reason, lanes, geom) VALUES
('AJC Bose Road', false, NULL, 4, ST_SetSRID(ST_GeomFromText('LINESTRING(88.30 22.58, 88.34 22.57, 88.38 22.56, 88.42 22.55, 88.46 22.54)'), 4326)),
('Park Street Corridor', false, NULL, 6, ST_SetSRID(ST_GeomFromText('LINESTRING(88.32 22.62, 88.34 22.59, 88.36 22.56, 88.38 22.53)'), 4326)),
('EM Bypass', false, NULL, 8, ST_SetSRID(ST_GeomFromText('LINESTRING(88.36 22.64, 88.40 22.62, 88.44 22.58, 88.46 22.54)'), 4326)),
('Diamond Harbour Road', false, NULL, 4, ST_SetSRID(ST_GeomFromText('LINESTRING(88.28 22.56, 88.32 22.54, 88.36 22.52, 88.40 22.50)'), 4326)),
('VIP Road', false, NULL, 6, ST_SetSRID(ST_GeomFromText('LINESTRING(88.34 22.62, 88.38 22.60, 88.42 22.58, 88.46 22.56, 88.50 22.54)'), 4326));

-- ============================================
-- Rescue Teams
-- ============================================
INSERT INTO rescue_teams (team_name, status, members_count, specialization, geom) VALUES
('NDRF Unit Alpha', 'standby', 25, 'search_rescue', ST_SetSRID(ST_MakePoint(88.35, 22.57), 4326)),
('NDRF Unit Bravo', 'standby', 20, 'medical', ST_SetSRID(ST_MakePoint(88.40, 22.59), 4326)),
('Army Engineers 14th', 'standby', 30, 'structural', ST_SetSRID(ST_MakePoint(88.37, 22.76), 4326)),
('Civil Defence Kolkata', 'active', 15, 'evacuation', ST_SetSRID(ST_MakePoint(88.34, 22.55), 4326)),
('Red Cross Mobile Unit', 'standby', 12, 'medical', ST_SetSRID(ST_MakePoint(88.36, 22.53), 4326));

-- ============================================
-- Hazard Zones
-- ============================================
INSERT INTO hazard_zones (zone_type, risk_level, description, geom) VALUES
('severe', 'critical', 'Liquefaction-prone zone near Hooghly riverbank', ST_SetSRID(ST_GeomFromText('POLYGON((88.30 22.60, 88.38 22.62, 88.42 22.58, 88.36 22.54, 88.30 22.60))'), 4326)),
('moderate', 'high', 'Subsidence risk area in South Kolkata', ST_SetSRID(ST_GeomFromText('POLYGON((88.40 22.50, 88.48 22.52, 88.50 22.46, 88.42 22.44, 88.40 22.50))'), 4326)),
('light', 'medium', 'General seismic awareness zone', ST_SetSRID(ST_GeomFromText('POLYGON((88.28 22.54, 88.34 22.54, 88.34 22.50, 88.28 22.50, 88.28 22.54))'), 4326));
