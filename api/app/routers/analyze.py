from fastapi import APIRouter, HTTPException
from .ingest import POS_CACHE
from .benchmark import CACHE as BENCH
import re
from collections import Counter

router = APIRouter()

def normalize_item(s: str) -> str:
    return re.sub(r"[^a-z ]","", (s or "").lower())

def extract_item_counts(reviews) -> Counter:
    text = " ".join([r.get("text","").lower() for r in reviews])
    keys = [r"americano", r"latte", r"cappuccino", r"cold brew", r"matcha", r"chai", r"mocha", r"espresso", r"oat milk", r"pumpkin spice", r"refresher", r"tea"]
    c = Counter()
    for k in keys:
        c[k] += len(re.findall(k, text))
    return c

@router.get("/report")
async def report():
    if POS_CACHE.get("df") is None:
        raise HTTPException(400, "Upload POS first.")
    if BENCH.get("competitors") is None:
        raise HTTPException(400, "Fetch competitors first.")

    df = POS_CACHE["df"]
    sales = df[df["Type"].str.lower()=="sale"].copy()

    top_items = (sales.assign(cnt=1)
                      .groupby(["Item Name","Size","Category"], as_index=False)[["cnt","Net Sales"]].sum()
                      .sort_values(["cnt","Net Sales"], ascending=[False,False])
                      .head(25)
                      .to_dict(orient="records"))

    your = sales.groupby(sales["Item Name"].map(normalize_item))["Transaction ID"].count()
    peer_counts = Counter()
    for reviews in BENCH["reviews"].values():
        peer_counts.update(extract_item_counts(reviews))

    your_max = max(1, your.max()) if len(your) else 1
    peer_max = max(1, max(peer_counts.values()) if peer_counts else 1)
    keys = set(list(your.index) + list(peer_counts.keys()))
    gaps = [{"item":k, "peer_signal": (peer_counts.get(k,0)/peer_max), "your_sales": (float(your.get(k,0))/your_max)} for k in keys]
    for g in gaps: g["opportunity"] = g["peer_signal"] - g["your_sales"]
    gaps = sorted(gaps, key=lambda x: x["opportunity"], reverse=True)[:20]

    comps = BENCH["competitors"]
    levels = [c.get("price_level") for c in comps if c.get("price_level") is not None]
    avg = round(sum(levels)/len(levels)) if levels else 2
    bands = {1:"$3.50–$4.50", 2:"$4.50–$6.50", 3:"$6.50–$8.50"}

    kpis = {
        "transactions": int(len(sales)),
        "net_sales": float(df["Net Sales"].sum()),
        "tax": float(df["Tax"].sum()),
        "tips": float(df["Tip"].sum()),
        "fees": float(df["Fees"].sum()),
        "net_to_bank": float(df["Net Total"].sum()),
    }

    return {
        "kpis": kpis,
        "competitors": comps,
        "top_items": top_items,
        "popularity_gaps": gaps,
        "price_bands": {"suggested": bands.get(avg, "$4.50–$6.50"), "peer_levels": levels}
    }
