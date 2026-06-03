from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
import json
import csv
from io import StringIO
from app.models.repository import get_simulation

router = APIRouter()

@router.get("/export/{sim_id}")
def export_simulation(sim_id: int, format: str = Query("json", description="Export format: json, csv, geojson")):
    sim_data = get_simulation(sim_id)
    if not sim_data:
        raise HTTPException(status_code=404, detail="Simulation not found")
        
    if format == "json":
        return sim_data
        
    elif format == "csv":
        output = StringIO()
        writer = csv.writer(output)
        
        # We export the district summary
        writer.writerow(["District", "Avg PGA", "Max PGA", "Severe Cells", "Moderate Cells", "Total Cells"])
        
        for district in sim_data["affected_districts"]:
            writer.writerow([
                district.get("district", ""),
                district.get("avg_pga", 0),
                district.get("max_pga", 0),
                district.get("severe_cells", 0),
                district.get("moderate_cells", 0),
                district.get("total_cells", 0)
            ])
            
        csv_content = output.getvalue()
        return Response(content=csv_content, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=simulation_{sim_id}.csv"})
        
    elif format == "geojson":
        # Usually we would export the full grid, but that might be large and require re-computing.
        # For now, we return the summary as JSON since GeoJSON was returned in the main simulate endpoint.
        raise HTTPException(status_code=501, detail="GeoJSON export not fully implemented for historical data yet. Please use JSON or CSV.")
        
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Use json, csv, or geojson.")
