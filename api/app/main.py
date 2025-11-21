from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="BrewBot Challenge API", version="0.1.0")

origins = os.getenv("CORS_ORIGIN", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

# mount routers
from app.routers import benchmark, find_places, competitor_chat, ingest

# app.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
app.include_router(benchmark.router, prefix="/benchmark", tags=["benchmark"])
# app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(find_places.router, prefix="/find_places", tags=["find_places"])
app.include_router(competitor_chat.router, prefix="/ai", tags=["ai"])
app.include_router(ingest.router,prefix="/ingest", tags=["ingest"])