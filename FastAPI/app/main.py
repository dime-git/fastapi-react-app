from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import CORS_ORIGINS
import os

# Create app
def create_app() -> FastAPI:
    """
    Application factory pattern: creates and configures the FastAPI app
    """
    app = FastAPI(title="Finance App API")
    
    # Set up CORS - more permissive for development, restricted for production
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if os.getenv("ENV", "development") != "production" else CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
    
    # Health check endpoint (works without Firebase)
    @app.get("/health")
    def health_check():
        """Health check endpoint"""
        return {"status": "ok", "message": "API is running"}

    # Version endpoint (works without Firebase)
    @app.get("/version")
    def version():
        """Version endpoint"""
        return {"version": "1.0.0", "environment": os.getenv("ENV", "development")}
    
    # Import routes only if including them in the app
    # (Comment these out temporarily until Firebase is properly configured)
    if os.getenv("INCLUDE_FULL_API", "").lower() in ("true", "1", "t"):
        from app.api.routes.transactions import router as transactions_router
        from app.api.routes.budget import router as budget_router
        from app.api.routes.recurring_transaction import router as recurring_transaction_router
        from app.api.routes.currency import router as currency_router
        from app.api.routes.goals import goals_router
        from app.api.routes.auth import auth_router
        
        # Include routers
        app.include_router(transactions_router, prefix="/api")
        app.include_router(budget_router, prefix="/api")
        app.include_router(recurring_transaction_router, prefix="/api")
        app.include_router(currency_router, prefix="/api")
        app.include_router(goals_router, prefix="/api")
        app.include_router(auth_router, prefix="/api")
        
        # Initialize currency service if needed
        @app.on_event("startup")
        async def startup_event():
            from app.services.currency_service import CurrencyService
            """Initialize default currencies and exchange rates on startup"""
            await CurrencyService.initialize_currencies()
    
    return app

app = create_app() 