from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Create app
app = FastAPI(title="Test API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Test API is running"}

@app.get("/env")
def env_variables():
    """List environment variables (excluding sensitive ones)"""
    safe_env = {}
    for key in os.environ:
        if not any(sensitive in key.lower() for sensitive in ["key", "secret", "password", "token"]):
            safe_env[key] = os.environ[key]
    return {"environment": safe_env} 