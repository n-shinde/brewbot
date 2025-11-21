# api/app/routers/analyze.py
from fastapi import APIRouter, HTTPException
import pandas as pd
from .ingest import POS_CACHE

router = APIRouter(prefix="/analyze", tags=["analyze"])

@router.get("/pos")
async def analyze_pos():
    df = POS_CACHE.get("df")
    if df is None or not isinstance(df, pd.DataFrame):
        raise HTTPException(400, "No POS data loaded yet. Upload a file first.")

    insights = {}

    # 1. Average Transaction Value (ATV)
    if "Transaction ID" in df.columns and "Net Sales" in df.columns:
        avg_tx = df.groupby("Transaction ID")["Net Sales"].sum().mean()
        insights["Average Transaction Value (ATV)"] = round(avg_tx, 2)

    # 2. Gross vs. Net Sales
    if "Gross Sales" in df.columns and "Net Sales" in df.columns:
        gross_total = df["Gross Sales"].sum()
        net_total = df["Net Sales"].sum()
        discount_diff = gross_total - net_total
        insights["Gross Sales Total"] = round(gross_total, 2)
        insights["Net Sales Total"] = round(net_total, 2)
        insights["Discount Difference"] = round(discount_diff, 2)

    # 3. Tip Contribution
    if "Tip" in df.columns and "Total Collected" in df.columns:
        total_tip = df["Tip"].sum()
        total_collected = df["Total Collected"].sum()
        tip_pct = (total_tip / total_collected * 100) if total_collected else 0
        insights["Total Tips"] = round(total_tip, 2)
        insights["Tip % of Total Collected"] = round(tip_pct, 2)

    # 4. Payment Processing Cost
    if "Fees" in df.columns:
        total_fees = df["Fees"].sum()
        insights["Total Payment Fees"] = round(total_fees, 2)

    # --- 5. Top/Bottom Selling Items
    if "Item Name" in df.columns and "Net Sales" in df.columns:
        item_summary = (
            df.groupby("Item Name")["Net Sales"]
            .agg(["sum", "count"])
            .sort_values("sum", ascending=False)
        )
        top_items = item_summary.head(5).reset_index().to_dict(orient="records")
        bottom_items = item_summary.tail(5).reset_index().to_dict(orient="records")
        insights["Top Items by Revenue"] = top_items
        insights["Bottom Items by Revenue"] = bottom_items

    # 6. Size Preference per Item
    if "Item Name" in df.columns and "Size" in df.columns:
        size_pref = (
            df.groupby(["Item Name", "Size"]).size().reset_index(name="count")
        )
        insights["Size Preference"] = size_pref.head(10).to_dict(orient="records")

    # 7. Category Sales Mix
    if "Category" in df.columns and "Net Sales" in df.columns:
        cat_sales = (
            df.groupby("Category")["Net Sales"].sum().sort_values(ascending=False)
        )
        insights["Category Sales Mix"] = cat_sales.reset_index().to_dict(orient="records")

    return {"insights": insights}
