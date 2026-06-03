import sqlite3
import json
import os
from typing import Dict, Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.abspath(os.path.join(BASE_DIR, '..', '..', 'data', 'simulations.db'))

def init_db():
    """Initialize the SQLite database schema."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Simulation History Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS simulations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            magnitude REAL NOT NULL,
            depth REAL NOT NULL,
            affected_districts_json TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()

def save_simulation(lat: float, lon: float, mag: float, depth: float, district_summary: list) -> int:
    """Save a simulation to the database and return the simulation ID."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    affected_districts = json.dumps(district_summary)
    
    cursor.execute('''
        INSERT INTO simulations (latitude, longitude, magnitude, depth, affected_districts_json)
        VALUES (?, ?, ?, ?, ?)
    ''', (lat, lon, mag, depth, affected_districts))
    
    sim_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    
    return sim_id

def get_simulation(sim_id: int) -> Dict[str, Any]:
    """Retrieve a simulation by ID."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM simulations WHERE id = ?', (sim_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
        
    return {
        "id": row[0],
        "timestamp": row[1],
        "latitude": row[2],
        "longitude": row[3],
        "magnitude": row[4],
        "depth": row[5],
        "affected_districts": json.loads(row[6])
    }

# Initialize the database when the module is imported
init_db()
