# from fastapi import APIRouter, UploadFile, File, HTTPException
# import pandas as pd

# router = APIRouter()
# POS_CACHE = {"df": None}

# REQUIRED = ["Date","Time","Transaction ID","Type","Customer Name","Item Name","Size","Category",
#             "Payment Method","Gross Sales","Discounts","Net Sales","Tax","Tip","Total Collected","Fees","Net Total"]

# @router.post("/pos")
# async def upload_pos(file: UploadFile = File(...)):
#     try:
#         df = pd.read_csv(file.file)
#         cols = {c.lower(): c for c in df.columns}
#         missing = [c for c in REQUIRED if c.lower() not in cols]
#         if missing:
#             raise ValueError(f"Missing columns: {missing}")
#         df = df.rename(columns={cols[c.lower()]: c for c in REQUIRED})
#         df["Date"] = pd.to_datetime(df["Date"]).dt.date
#         for c in ["Gross Sales","Discounts","Net Sales","Tax","Tip","Total Collected","Fees","Net Total"]:
#             df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0.0)
#         POS_CACHE["df"] = df
#         return {"rows": len(df), "start_date": str(df["Date"].min()), "end_date": str(df["Date"].max())}
#     except Exception as e:
#         raise HTTPException(400, f"Invalid CSV: {e}")
