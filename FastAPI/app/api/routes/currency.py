from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any

from app.models.currency import Currency, ExchangeRate, ConversionRequest
from app.services.currency_service import CurrencyService

router = APIRouter(
    prefix="/currencies",
    tags=["currencies"]
)

@router.get("/", response_model=List[Currency])
async def get_all_currencies():
    """Get all available currencies"""
    try:
        currencies = await CurrencyService.get_all_currencies()
        if not currencies:
            # If no currencies found, return empty list instead of error
            return []
        return currencies
    except Exception as e:
        # Return empty list on error instead of failing
        print(f"Error fetching currencies: {e}")
        return []

@router.get("/default", response_model=Currency)
async def get_default_currency():
    """Get the default currency"""
    try:
        currency = await CurrencyService.get_default_currency()
        if not currency:
            # Create a default USD currency if none exists
            default = {"code": "USD", "name": "US Dollar", "symbol": "$", "is_default": True}
            return default
        return currency
    except Exception as e:
        print(f"Error fetching default currency: {e}")
        # Return USD as fallback
        return {"code": "USD", "name": "US Dollar", "symbol": "$", "is_default": True}

@router.post("/default/{currency_code}", response_model=Dict[str, bool])
async def set_default_currency(currency_code: str):
    """Set a currency as the default"""
    try:
        success = await CurrencyService.set_default_currency(currency_code)
        if not success:
            raise HTTPException(status_code=404, detail=f"Currency with code {currency_code} not found")
        return {"success": True, "message": f"Currency {currency_code} set as default"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error setting default currency: {e}")
        return {"success": False, "message": "Internal error setting default currency"}

@router.get("/rates", response_model=Dict[str, Any])
async def get_exchange_rates(base_currency: str = None):
    """Get latest exchange rates"""
    try:
        rates = await CurrencyService.get_latest_exchange_rates(base_currency)
        if not rates:
            # If no rates, return basic structure
            return {"base": base_currency or "USD", "rates": {}, "timestamp": 0}
        return rates
    except Exception as e:
        print(f"Error fetching exchange rates: {e}")
        return {"base": base_currency or "USD", "rates": {}, "timestamp": 0}

@router.post("/convert", response_model=Dict[str, Any])
async def convert_currency(conversion: ConversionRequest):
    """Convert amount between currencies"""
    try:
        result = await CurrencyService.convert_currency(
            conversion.amount,
            conversion.from_currency,
            conversion.to_currency
        )
        return result
    except Exception as e:
        print(f"Error converting currency: {e}")
        # Return a simple 1:1 conversion when errors occur
        return {
            "amount": conversion.amount,
            "from_currency": conversion.from_currency,
            "to_currency": conversion.to_currency,
            "result": conversion.amount,
            "rate": 1.0
        }

@router.post("/initialize", response_model=Dict[str, bool])
async def initialize_currencies():
    """Initialize default currencies and exchange rates"""
    try:
        await CurrencyService.initialize_currencies()
        return {"success": True, "message": "Currencies and exchange rates initialized"}
    except Exception as e:
        print(f"Error initializing currencies: {e}")
        return {"success": False, "message": f"Failed to initialize currencies: {str(e)}"} 