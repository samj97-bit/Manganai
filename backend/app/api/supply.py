"""
MANGANAI - Supply Intelligence API
"""
from fastapi import APIRouter
from ..geospatial.demo_data import get_supply_data

router = APIRouter(prefix="/api/supply", tags=["supply"])


@router.get("")
def get_supply():
    """Return historical supply/demand data for manganese."""
    data = get_supply_data()
    return {
        **data,
        "disclaimer": "Scenario estimates for decision support. Not certified production forecasts.",
    }


@router.get("/scenarios")
def get_scenarios():
    """Return scenario projections for different exploration outcomes."""
    data = get_supply_data()
    years_forecast = [2026, 2027, 2028, 2029, 2030]

    # Base trajectory (business as usual)
    base_supply = [3.71, 3.78, 3.84, 3.90, 3.95]
    base_demand = [5.98, 6.32, 6.68, 7.05, 7.45]

    # Scenario: Add top 1 target (incremental production ~0.15 Mt/yr by 2030)
    top1_supply = [3.71, 3.82, 3.95, 4.08, 4.20]

    # Scenario: Add top 5 targets (~0.45 Mt/yr additional by 2030)
    top5_supply = [3.71, 3.95, 4.25, 4.58, 4.90]

    # Scenario: Exploration acceleration (AI-prioritized fast-track ~0.75 Mt/yr)
    accel_supply = [3.71, 4.10, 4.58, 5.05, 5.55]

    def shortfall(supply, demand):
        return [round(d - s, 2) for s, d in zip(supply, demand)]

    return {
        "years": years_forecast,
        "scenarios": {
            "current_trajectory": {
                "name": "Current trajectory",
                "supply": base_supply,
                "demand": base_demand,
                "shortfall": shortfall(base_supply, base_demand),
                "gap_2030": round(base_demand[-1] - base_supply[-1], 2),
            },
            "top1_target": {
                "name": "Add top 1 target",
                "supply": top1_supply,
                "demand": base_demand,
                "shortfall": shortfall(top1_supply, base_demand),
                "gap_2030": round(base_demand[-1] - top1_supply[-1], 2),
            },
            "top5_targets": {
                "name": "Add top 5 targets",
                "supply": top5_supply,
                "demand": base_demand,
                "shortfall": shortfall(top5_supply, base_demand),
                "gap_2030": round(base_demand[-1] - top5_supply[-1], 2),
            },
            "exploration_acceleration": {
                "name": "Exploration acceleration",
                "supply": accel_supply,
                "demand": base_demand,
                "shortfall": shortfall(accel_supply, base_demand),
                "gap_2030": round(base_demand[-1] - accel_supply[-1], 2),
            },
        },
        "base_gap_2030": round(base_demand[-1] - base_supply[-1], 2),
        "unit": "Mt",
        "disclaimer": "Scenario estimates for decision support. Not certified production forecasts.",
    }
