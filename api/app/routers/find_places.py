import os
from fastapi import APIRouter, HTTPException, Query
import httpx

router = APIRouter()
API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
if not API_KEY:
    # Don't crash import; raise at request time instead.
    pass

AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

@router.get("/places/autocomplete")
async def places_autocomplete(
    input: str = Query(..., min_length=1),
    session_token: str = Query(...),
    types: str = Query("geocode"),  # predicts addresses
    components: str | None = None,  # e.g. "country:us" for US-only predictions
):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Missing GOOGLE_MAPS_API_KEY")
    params = {
        "input": input,
        "types": types,
        "key": API_KEY,
        "sessiontoken": session_token,
    }
    if components:
        params["components"] = components
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(AUTOCOMPLETE_URL, params=params)
    data = r.json()
    if r.status_code != 200 or data.get("status") not in ("OK", "ZERO_RESULTS"):
        raise HTTPException(status_code=400, detail=data)
    # Return minimal info needed for UI
    preds = data.get("predictions", [])
    return [
        {
            "description": p.get("description"),
            "place_id": p.get("place_id"),
            "structured_formatting": p.get("structured_formatting"),
        }
        for p in preds
    ]

@router.get("/places/details")
async def places_details(
    place_id: str = Query(...),
    session_token: str = Query(...),
):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Missing Google Maps API key")
    params = {
        "place_id": place_id,
        "fields": "geometry/location,name,formatted_address",
        "key": API_KEY,
        "sessiontoken": session_token,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(DETAILS_URL, params=params)
    data = r.json()
    if r.status_code != 200 or data.get("status") != "OK":
        raise HTTPException(status_code=400, detail=data)
    res = data["result"]
    loc = res["geometry"]["location"]  # {lat, lng}
    return {
        "lat": loc["lat"],
        "lng": loc["lng"],
        "name": res.get("name"),
        "formatted_address": res.get("formatted_address"),
    }
