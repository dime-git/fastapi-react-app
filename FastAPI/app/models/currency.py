from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime

class Currency(BaseModel):
    """Model for currency definition"""
    code: str
    name: str
    symbol: str
    is_default: bool = False

class ExchangeRate(BaseModel):
    """Model for exchange rate data"""
    base_currency: str
    rates: Dict[str, float]
    timestamp: datetime

class ConversionRequest(BaseModel):
    """Model for currency conversion request"""
    amount: float
    from_currency: str
    to_currency: str 