"""Saheli AI minimal FastAPI backend scaffold."""
from fastapi import FastAPI

app = FastAPI(title="Saheli AI", version="0.1.0")

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "saheli-api", "version": "0.1.0"}
