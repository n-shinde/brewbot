import os
import math
from typing import List, Dict, Any

from fastapi import APIRouter, Query, HTTPException
import httpx

router = APIRouter()

# Google Places Nearby Search endpoint (v1)
PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchNearby"
API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

# Simple Haversine formula for distance in meters
def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = phi2 - phi1
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))

# Map Google price levels (text) to numeric
def price_to_int(price_level: str | None) -> int | None:
    mapping = {
        "FREE": 0,
        "INEXPENSIVE": 1,
        "MODERATE": 2,
        "EXPENSIVE": 3,
        "VERY_EXPENSIVE": 4,
    }
    return mapping.get(price_level) if price_level else None


@router.get("/nearby")
async def nearby(
    lat: float = Query(..., description="Latitude of center point"),
    lng: float = Query(..., description="Longitude of center point"),
    radius_m: int = Query(8000, description="Search radius in meters"),  # Approximately 5 mile radius
    max_results: int = Query(10, description="Maximum number of results to return"),
):
    """
    Search for nearby coffee shops around the given coordinates using
    the Google Places API (Web Service).
    """
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Missing GOOGLE_MAPS_API_KEY")

    # Build the payload for Google Places Nearby Search
    payload = {
        "includedTypes": ["coffee_shop"],  # Restrict to coffee shops
        "maxResultCount": max_results,
        "rankPreference": "DISTANCE",  # Sort results by proximity
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": float(radius_m),
            }
        },
    }

    # Ask only for fields you need (reduces billing cost)
    field_mask = ",".join(
        [
            "places.id",
            "places.displayName",
            "places.rating",
            "places.userRatingCount",
            "places.priceLevel",
            "places.location",
            "places.formattedAddress",
        ]
    )

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": field_mask,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(PLACES_ENDPOINT, headers=headers, json=payload)

        if resp.status_code != 200:
            # Return the Google API error message for debugging
            raise HTTPException(status_code=resp.status_code, detail=resp.text)

        data = resp.json()
        places: List[Dict[str, Any]] = data.get("places", [])

        competitors = []
        for p in places:
            display_name = (p.get("displayName") or {}).get("text")
            loc = p.get("location") or {}
            plat, plng = loc.get("latitude"), loc.get("longitude")

            competitors.append(
                {
                    "id": p.get("id", ""),
                    "name": display_name,
                    "rating": p.get("rating"),
                    "review_count": p.get("userRatingCount"),
                    "price_level": price_to_int(p.get("priceLevel")),
                    "formatted_address": p.get("formattedAddress"),
                    "source": "google",
                    "distance_m": (
                        haversine_m(lat, lng, plat, plng)
                        if plat is not None and plng is not None
                        else None
                    ),
                }
            )

        # Sort by distance again (defensive; API already returns closest first)
        competitors.sort(key=lambda c: c.get("distance_m") or float("inf"))

        return {"competitors": competitors}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Nearby search failed: {e}")

