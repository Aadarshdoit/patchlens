import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.verification import router as verification_router
from api.upload import router as upload_router

load_dotenv()

app = FastAPI(
    title="PatchLens API",
    version="0.1.0",
    description="Independent verification API for AI-generated code fixes.",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
# In development the frontend runs on localhost:3000.
# For production, set the ALLOWED_ORIGINS environment variable to a
# comma-separated list of permitted origins.
# Example: ALLOWED_ORIGINS=https://patchlens.example.com
# ---------------------------------------------------------------------------
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(verification_router)
app.include_router(upload_router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "patchlens-api",
    }
