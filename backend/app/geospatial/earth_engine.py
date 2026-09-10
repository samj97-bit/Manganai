import os
import ee
import pandas as pd
from typing import Dict, Any

# Get project ID from env or fallback to a dummy placeholder
PROJECT_ID = os.getenv("GEE_PROJECT_ID", "your-project-id")

_initialized = False

def init_gee():
    global _initialized
    if _initialized:
        return True
        
    try:
        # Try to initialize with default credentials (e.g. from ee.Authenticate() run locally)
        ee.Initialize(project=PROJECT_ID)
        _initialized = True
        return True
    except Exception as e:
        print(f"GEE Initialization failed: {e}")
        # Note: In a production server, we would use a Service Account JSON key.
        # For development, the user must run `earthengine authenticate` or `ee.Authenticate()` in their local Python env first.
        return False

def extract_features(longitude: float = 80.18, latitude: float = 21.80, radius_m: int = 5000) -> Dict[str, Any]:
    """
    Follows the step-by-step instructions to extract terrain features using Earth Engine.
    Returns the dataframe head as a string and dictionary for API consumption.
    """
    if not init_gee():
        return {
            "success": False,
            "error": "Earth Engine not initialized. Please run `ee.Authenticate()` locally first or set valid credentials."
        }
        
    try:
        print("GEE API Status: Successfully connected to your cloud engine!")
        
        # Step 4: Define Exploration Coordinates
        target_area = ee.Geometry.Point([longitude, latitude]).buffer(radius_m)
        print("Target geographic sector configured successfully.")
        
        # Step 5/6: Define terrain_stack and sample grid
        # We use USGS SRTM elevation data to build a basic terrain stack
        dem = ee.Image('USGS/SRTMGL1_003')
        slope = ee.Terrain.slope(dem)
        aspect = ee.Terrain.aspect(dem)
        
        # Combine into a stack
        terrain_stack = ee.Image.cat([dem, slope, aspect]).rename(['elevation', 'slope', 'aspect'])
        
        # Extract data points
        sample_grid = terrain_stack.sample(region=target_area, scale=200, numPixels=100)
        
        # Convert to Python list format
        feature_list = []
        for feature in sample_grid.getInfo()['features']:
            properties = feature['properties']
            feature_list.append(properties)
            
        # Load into DataFrame
        df = pd.DataFrame(feature_list)
        
        print("\n--- AI FEATURE MATRIX EXTRACTED ---")
        print(df.head())
        
        return {
            "success": True,
            "message": "AI FEATURE MATRIX EXTRACTED",
            "columns": list(df.columns),
            "head": df.head().to_dict(orient="records"),
            "total_samples": len(df)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
