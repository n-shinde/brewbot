from fastapi import APIRouter, Query
router = APIRouter()
CACHE = {"competitors": None, "reviews": None}

@router.get("/nearby")
async def nearby(lat: float = Query(...), lng: float = Query(...), radius_m: int = 3000, max_results: int = 20):
    comps = [
        {"id":"g_1","name":"Sunrise Coffee","rating":4.6,"review_count":453,"price_level":2,"source":"google"},
        {"id":"g_2","name":"Mint & Matcha","rating":4.5,"review_count":311,"price_level":2,"source":"google"},
    ]
    reviews = {
        "g_1":[{"id":"r1","place_id":"g_1","source":"google","rating":5,"text":"Loved the iced matcha and oat milk options!"}],
        "g_2":[{"id":"r2","place_id":"g_2","source":"google","rating":4,"text":"Pumpkin spice latte was great; prices a bit high."}],
    }
    CACHE["competitors"] = comps
    CACHE["reviews"] = reviews
    return {"competitors": comps}
