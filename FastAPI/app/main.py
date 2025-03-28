from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import CORS_ORIGINS
from app.api.routes.transactions import router as transactions_router

def create_app() -> FastAPI:
    """
    Application factory pattern: creates and configures the FastAPI app
    """
    app = FastAPI(title="Finance App API")
    
    # Set up CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(transactions_router, prefix="/transactions", tags=["transactions"])
    
    # Add a route without the trailing slash for transactions
    app.include_router(transactions_router, prefix="/transactions", tags=["transactions_alt"])
    
    @app.get("/health")
    def health_check():
        """Health check endpoint"""
        return {"status": "ok"}
        
    return app

app = create_app() 