from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import CORS_ORIGINS
from app.api.routes.transactions import router as transactions_router
from app.api.routes.budget import router as budget_router
from app.api.routes.recurring_transaction import router as recurring_transaction_router
from app.api.routes.currency import router as currency_router
from app.api.routes.goals import goals_router
from app.api.routes.auth import auth_router
from app.services.currency_service import CurrencyService

def create_app() -> FastAPI:
    """
    Application factory pattern: creates and configures the FastAPI app
    """
    app = FastAPI(title="Finance App API")
    
    # Set up CORS - more permissive for development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # For development - change to CORS_ORIGINS for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
    
    # Include routers
    app.include_router(transactions_router, prefix="/api")
    app.include_router(budget_router, prefix="/api")
    app.include_router(recurring_transaction_router, prefix="/api")
    app.include_router(currency_router, prefix="/api")
    app.include_router(goals_router, prefix="/api")
    app.include_router(auth_router, prefix="/api")
    
    @app.get("/health")
    def health_check():
        """Health check endpoint"""
        return {"status": "ok"}
    
    @app.on_event("startup")
    async def startup_event():
        """Initialize default currencies and exchange rates on startup"""
        await CurrencyService.initialize_currencies()
    
    return app

app = create_app() 