from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import io
import pandas as pd
import re

router = APIRouter(prefix="/ingest", tags=["ingest"])

POS_CACHE = {"df": None, "filename": None}

CURRENCY_RE = re.compile(r"[,\s$]")  # commas/whitespace/$

def _coerce_numeric_columns(df: pd.DataFrame) -> list[str]:
    """Try converting object columns that look numeric to float."""
    converted = []
    for col in df.columns:
        if df[col].dtype == "object":
            # peek a sample to decide if it looks numeric
            sample = df[col].dropna().astype(str).head(50)
            if len(sample) == 0:
                continue
            # if most values look like numbers (with optional $ and commas)
            looks_numeric = (sample.str.replace(CURRENCY_RE, "", regex=True)
                                   .str.match(r"^-?\d+(\.\d+)?$")).mean() >= 0.7
            if looks_numeric:
                cleaned = df[col].astype(str).str.replace(CURRENCY_RE, "", regex=True)
                df[col] = pd.to_numeric(cleaned, errors="coerce")
                converted.append(col)
    return converted

def _coerce_datetime_columns(df: pd.DataFrame) -> list[str]:
    """Try converting date/time-like columns to datetime (or date)."""
    converted = []
    for col in df.columns:
        if df[col].dtype == "object" or "date" in col.lower() or "time" in col.lower():
            # attempt parse; success if most non-nulls parse
            parsed = pd.to_datetime(df[col], errors="coerce", utc=False, infer_datetime_format=True)
            if parsed.notna().mean() >= 0.7:  # 70%+ parseable ⇒ accept
                df[col] = parsed
                converted.append(col)
    return converted

def _read_dataframe(file: UploadFile) -> pd.DataFrame:
    name = (file.filename or "").lower()
    suffix = Path(name).suffix
    raw = file.file.read()  # SpooledTemporaryFile -> bytes for Excel or decode for CSV/TXT

    if suffix in {".xlsx", ".xls"}:
        return pd.read_excel(io.BytesIO(raw))  # requires openpyxl for .xlsx
    elif suffix in {".csv", ".txt"}:
        # Let pandas infer delimiter; accept weird encodings
        text = raw.decode("utf-8", errors="ignore")
        return pd.read_csv(io.StringIO(text), sep=None, engine="python")
    else:
        # Heuristic fallback: try Excel first, then CSV
        try:
            return pd.read_excel(io.BytesIO(raw))
        except Exception:
            try:
                text = raw.decode("utf-8", errors="ignore")
                return pd.read_csv(io.StringIO(text), sep=None, engine="python")
            except Exception as e:
                raise HTTPException(400, f"Unsupported or unreadable file: {e}")

@router.post("/pos")
async def upload_pos(file: UploadFile = File(...)):
    try:
        df = _read_dataframe(file)

        # Trim header whitespace
        df.rename(columns=lambda c: str(c).strip(), inplace=True)

        # Light inference/normalization
        inferred_dates = _coerce_datetime_columns(df)
        inferred_numeric = _coerce_numeric_columns(df)

        POS_CACHE["df"] = df
        POS_CACHE["filename"] = file.filename

        # Optional: compute a generic date range if any datetime-like column exists
        date_range = None
        if inferred_dates:
            # pick the first inferred datetime-like column for a coarse range
            dcol = inferred_dates[0]
            nonnull = df[dcol].dropna()
            if not nonnull.empty:
                # if this column has time, you can return both min/max; or .date() if you prefer dates only
                start = nonnull.min()
                end = nonnull.max()
                date_range = {"column": dcol, "start": str(start), "end": str(end)}

        # Small preview for UI
        preview = df.head(5).to_dict(orient="records")

        return {
            "filename": file.filename,
            "rows": int(len(df)),
            "cols": list(map(str, df.columns)),
            "inferred_numeric": inferred_numeric,
            "inferred_datetime": inferred_dates,
            "date_range": date_range,
            "preview": preview,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Invalid file: {e}")

