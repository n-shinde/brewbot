import os
import math
from typing import List, Dict, Any
import asyncio


from fastapi import APIRouter, Query, HTTPException
import httpx

router = APIRouter()

# Google Places Nearby Search endpoint (v1)
PLACES_NEARBY = "https://places.googleapis.com/v1/places:searchNearby"
PLACES_DETAILS = "https://places.googleapis.com/v1/places"

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
    min_rating: float = Query(4.0, ge=0.0, le=5.0, description="Minimum rating to include"),
):
    """
    Search for nearby coffee shops around the given coordinates using
    the Google Places API (Web Service).
    """
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Missing GOOGLE_MAPS_API_KEY")

    # Build the payload for Google Places Nearby Search
    nearby_payload = {
        "includedTypes": ["coffee_shop"],  # Restrict to coffee shops
        "maxResultCount": max_results*2,
        "rankPreference": "DISTANCE",  # Sort results by proximity
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": float(radius_m),
            }
        },
    }

    # Ask only for fields you need (reduces billing cost)
    nearby_field_mask = ",".join(
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
        "X-Goog-FieldMask": nearby_field_mask,
    }

    try:
        REVIEWS_PER_PLACE = 5  # up to 5 newest reviews per place

        async with httpx.AsyncClient(timeout=10.0) as client:
            # 1) Nearby search
            resp = await client.post(PLACES_NEARBY, headers=headers, json=nearby_payload)
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

            # 2) Filter by rating >= 4.0
            filtered = [c for c in competitors if (c.get("rating") or 0) >= min_rating]

            # If filtering is too strict, fall back to unfiltered
            pool = filtered if filtered else competitors

            # 3) Sort by rating desc, then distance asc
            def sort_key(c):
                rating = c.get("rating") or 0
                dist = c.get("distance_m")
                dist_val = dist if dist is not None else float("inf")
                return (-rating, dist_val)

            pool.sort(key=sort_key)

            # 4) Trim to max_results
            competitors = pool[:max_results]

            # 5) Fetch newest reviews for each selected place via Place Details 
            #    Build a separate field mask for reviews
            details_field_mask = ",".join(
                [
                    "id",
                    "displayName",
                    "reviews.text",
                    "reviews.rating",
                    "reviews.publishTime",
                    "reviews.authorAttribution",
                    "reviews.name",
                ]
            )
            details_headers = {
                "X-Goog-Api-Key": API_KEY,
                "X-Goog-FieldMask": details_field_mask,
                "Content-Type": "application/json",
            }

            async def fetch_details(place_id: str):
                if not place_id:
                    return None
                url = f"{PLACES_DETAILS}/{place_id}"
                params = {"reviews_sort": "newest"}
                r = await client.get(url, headers=details_headers, params=params)
                if r.status_code != 200:
                    return None
                return r.json()

            tasks = [fetch_details(c["id"]) for c in competitors if c.get("id")]
            details_list = await asyncio.gather(*tasks, return_exceptions=False)

        # 6) Attach up to 5 newest reviews (no date filtering)
        by_id = {c["id"]: c for c in competitors}
        for det in details_list:
            if not det:
                continue
            pid = det.get("id")
            base = by_id.get(pid)
            if not base:
                continue
            revs = det.get("reviews") or []
            newest = [
                {
                    "rating": r.get("rating"),
                    "publish_time": r.get("publishTime"),
                    "text": (r.get("text") or "")[:400],
                    "author": (r.get("authorAttribution") or {}).get("displayName"),
                }
                for r in revs[:REVIEWS_PER_PLACE]
            ]
            base["recent_reviews"] = newest

        return {"competitors": competitors}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Nearby search failed: {e}")

    # try:
    #     async with httpx.AsyncClient(timeout=10.0) as client:
    #         resp = await client.post(PLACES_NEARBY, headers=headers, json=nearby_payload)

    #     if resp.status_code != 200:
    #         # Return the Google API error message for debugging
    #         raise HTTPException(status_code=resp.status_code, detail=resp.text)

    #     data = resp.json()
    #     places: List[Dict[str, Any]] = data.get("places", [])

    #     competitors = []
    #     for p in places:
    #         display_name = (p.get("displayName") or {}).get("text")
    #         loc = p.get("location") or {}
    #         plat, plng = loc.get("latitude"), loc.get("longitude")

    #         competitors.append(
    #             {
    #                 "id": p.get("id", ""),
    #                 "name": display_name,
    #                 "rating": p.get("rating"),
    #                 "review_count": p.get("userRatingCount"),
    #                 "price_level": price_to_int(p.get("priceLevel")),
    #                 "formatted_address": p.get("formattedAddress"),
    #                 "source": "google",
    #                 "distance_m": (
    #                     haversine_m(lat, lng, plat, plng)
    #                     if plat is not None and plng is not None
    #                     else None
    #                 ),
    #             }
    #         )

    #     # 1) Filter by rating >= 4.0
    #     filtered = [c for c in competitors if (c.get("rating") or 0) >= min_rating]

    #     # If filtering is too strict, fall back to unfiltered
    #     pool = filtered if filtered else competitors

    #     # 2) Sort by rating desc, then distance asc
    #     def sort_key(c):
    #         rating = c.get("rating") or 0
    #         dist = c.get("distance_m")
    #         # put None distances at the end
    #         dist_val = dist if dist is not None else float("inf")
    #         return (-rating, dist_val)

    #     pool.sort(key=sort_key)

    #     # 3) Trim to max_results
    #     competitors = pool[:max_results]

    #     return {"competitors": competitors}

    # except HTTPException:
    #     raise
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=f"Nearby search failed: {e}")

