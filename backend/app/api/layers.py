"""
MANGANAI - Layers API
Returns available geospatial layers and their metadata.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/layers", tags=["layers"])

LAYERS = [
    {
        "id": "sentinel2",
        "name": "Sentinel-2",
        "description": "Multispectral satellite imagery (10m resolution)",
        "source": "European Space Agency / Google Earth Engine",
        "type": "satellite",
        "status": "demo",
        "default_visible": True,
        "opacity": 0.8,
        "bands": ["B4", "B8", "B11", "B12"],
        "indices": ["NDVI", "Fe-Mn Ratio", "Clay Index"],
    },
    {
        "id": "geology",
        "name": "Geological Map",
        "description": "Geological formations and lithological units",
        "source": "Geological Survey of India (Demo)",
        "type": "vector",
        "status": "demo",
        "default_visible": True,
        "opacity": 0.6,
    },
    {
        "id": "occurrences",
        "name": "Known Mn Occurrences",
        "description": "Known manganese deposits, mines and prospects",
        "source": "IBM / GSI Published Data (Demo)",
        "type": "point",
        "status": "demo",
        "default_visible": True,
        "opacity": 1.0,
    },
    {
        "id": "terrain",
        "name": "Terrain / DEM",
        "description": "Digital Elevation Model (SRTM 30m)",
        "source": "USGS SRTM / Earth Engine",
        "type": "raster",
        "status": "demo",
        "default_visible": True,
        "opacity": 0.5,
    },
    {
        "id": "faults",
        "name": "Fault / Lineament",
        "description": "Major fault systems and structural lineaments",
        "source": "GSI Structural Map (Demo)",
        "type": "line",
        "status": "demo",
        "default_visible": False,
        "opacity": 0.9,
    },
    {
        "id": "magnetic",
        "name": "Magnetic Survey",
        "description": "Airborne magnetic anomaly data",
        "source": "NGRI India (Demo)",
        "type": "raster",
        "status": "limited",
        "default_visible": False,
        "opacity": 0.6,
    },
    {
        "id": "em",
        "name": "EM Survey",
        "description": "Electromagnetic geophysical survey",
        "source": "State Geological Dept (Demo)",
        "type": "raster",
        "status": "limited",
        "default_visible": False,
        "opacity": 0.6,
    },
    {
        "id": "boreholes",
        "name": "Boreholes",
        "description": "Drilling and borehole records",
        "source": "IBM Drill Core Repository (Demo)",
        "type": "point",
        "status": "limited",
        "default_visible": False,
        "opacity": 1.0,
    },
    {
        "id": "prospectivity",
        "name": "AI Prospectivity",
        "description": "AI/ML manganese prospectivity prediction layer",
        "source": "MANGANAI ML Model",
        "type": "heatmap",
        "status": "ready",
        "default_visible": False,
        "opacity": 0.7,
    },
]


@router.get("")
def get_layers():
    return {"layers": LAYERS, "count": len(LAYERS)}
