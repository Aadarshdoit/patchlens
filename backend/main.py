from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.verification import router as verification_router


app = FastAPI(
    title="PatchLens API",
    version="0.1.0",
    description="Independent verification API for AI-generated code fixes.",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(verification_router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "patchlens-api",
    }