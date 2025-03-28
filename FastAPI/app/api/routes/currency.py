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
    return await CurrencyService.get_all_currencies()

@router.get("/default", response_model=Currency)
async def get_default_currency():
    """Get the default currency"""
    currency = await CurrencyService.get_default_currency()
    if not currency:
        raise HTTPException(status_code=404, detail="No default currency found")
    return currency

@router.post("/default/{currency_code}", response_model=Dict[str, bool])
async def set_default_currency(currency_code: str):
    """Set a currency as the default"""
    success = await CurrencyService.set_default_currency(currency_code)
    if not success:
        raise HTTPException(status_code=404, detail=f"Currency with code {currency_code} not found")
    return {"success": True, "message": f"Currency {currency_code} set as default"}

@router.get("/rates", response_model=Dict[str, Any])
async def get_exchange_rates(base_currency: str = None):
    """Get latest exchange rates"""
    rates = await CurrencyService.get_latest_exchange_rates(base_currency)
    if not rates:
        raise HTTPException(status_code=404, detail="No exchange rates found")
    return rates

@router.post("/convert", response_model=Dict[str, Any])
async def convert_currency(conversion: ConversionRequest):
    """Convert amount between currencies"""
    result = await CurrencyService.convert_currency(
        conversion.amount,
        conversion.from_currency,
        conversion.to_currency
    )
    return result

@router.post("/initialize", response_model=Dict[str, bool])
async def initialize_currencies():
    """Initialize default currencies and exchange rates"""
    await CurrencyService.initialize_currencies()
    return {"success": True, "message": "Currencies and exchange rates initialized"} 