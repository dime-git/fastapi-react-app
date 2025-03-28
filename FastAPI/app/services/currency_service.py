from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
from firebase_admin import firestore
from app.core.config import db

# Collection references
currencies_ref = db.collection('currencies')
exchange_rates_ref = db.collection('exchange_rates')

class CurrencyService:
    """Service for managing currencies and exchange rates in Firebase"""
    
    # Default exchange rates (as of early 2023, these are approximate)
    DEFAULT_RATES = {
        "USD": {
            "EUR": 0.92,   # 1 USD = 0.92 EUR
            "MKD": 56.80   # 1 USD = 56.80 MKD
        },
        "EUR": {
            "USD": 1.09,   # 1 EUR = 1.09 USD
            "MKD": 61.50   # 1 EUR = 61.50 MKD
        },
        "MKD": {
            "USD": 0.0176, # 1 MKD = 0.0176 USD
            "EUR": 0.0163  # 1 MKD = 0.0163 EUR
        }
    }
    
    # Default currencies
    DEFAULT_CURRENCIES = [
        {
            "code": "USD",
            "name": "US Dollar",
            "symbol": "$",
            "is_default": True
        },
        {
            "code": "EUR",
            "name": "Euro",
            "symbol": "€",
            "is_default": False
        },
        {
            "code": "MKD",
            "name": "Macedonian Denar",
            "symbol": "ден",
            "is_default": False
        }
    ]
    
    @staticmethod
    async def initialize_currencies():
        """Initialize currencies and exchange rates if they don't exist"""
        # Check if currencies exist
        currencies = await CurrencyService.get_all_currencies()
        
        if not currencies:
            # Add default currencies
            for currency in CurrencyService.DEFAULT_CURRENCIES:
                await CurrencyService.create_currency(currency)
        
        # Check if exchange rates exist
        rates = await CurrencyService.get_latest_exchange_rates()
        
        if not rates:
            # Add default exchange rates
            for base_currency, rates in CurrencyService.DEFAULT_RATES.items():
                await CurrencyService.update_exchange_rates(base_currency, rates)
    
    @staticmethod
    async def create_currency(currency_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new currency"""
        # Use currency code as document ID
        currency_id = currency_data['code']
        
        # Check if already exists
        doc = currencies_ref.document(currency_id).get()
        if doc.exists:
            return doc.to_dict()
        
        # Save to Firestore
        currencies_ref.document(currency_id).set(currency_data)
        
        return currency_data
    
    @staticmethod
    async def get_all_currencies() -> List[Dict[str, Any]]:
        """Get all currencies"""
        docs = currencies_ref.stream()
        
        currencies = []
        for doc in docs:
            currency = doc.to_dict()
            currencies.append(currency)
            
        return currencies
    
    @staticmethod
    async def get_currency(currency_code: str) -> Optional[Dict[str, Any]]:
        """Get a currency by code"""
        doc = currencies_ref.document(currency_code).get()
        if doc.exists:
            return doc.to_dict()
        return None
    
    @staticmethod
    async def update_currency(currency_code: str, currency_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a currency"""
        currency_ref = currencies_ref.document(currency_code)
        doc = currency_ref.get()
        
        if not doc.exists:
            return None
        
        # Update in Firestore
        currency_ref.update(currency_data)
        
        # Get and return updated document
        updated_doc = currency_ref.get()
        return updated_doc.to_dict()
    
    @staticmethod
    async def get_default_currency() -> Optional[Dict[str, Any]]:
        """Get the default currency"""
        query = currencies_ref.where(filter=firestore.FieldFilter("is_default", "==", True)).limit(1)
        docs = query.stream()
        
        for doc in docs:
            return doc.to_dict()
        
        # If no default is set, return USD
        return await CurrencyService.get_currency("USD")
    
    @staticmethod
    async def set_default_currency(currency_code: str) -> bool:
        """Set a currency as default and unset others"""
        # First, ensure the currency exists
        currency = await CurrencyService.get_currency(currency_code)
        if not currency:
            return False
        
        # Get current default
        current_default = await CurrencyService.get_default_currency()
        
        # Begin a batch operation
        batch = db.batch()
        
        # Unset current default if exists
        if current_default and current_default['code'] != currency_code:
            current_default_ref = currencies_ref.document(current_default['code'])
            batch.update(current_default_ref, {"is_default": False})
        
        # Set new default
        new_default_ref = currencies_ref.document(currency_code)
        batch.update(new_default_ref, {"is_default": True})
        
        # Commit batch
        batch.commit()
        
        return True
    
    @staticmethod
    async def update_exchange_rates(base_currency: str, rates: Dict[str, float]) -> Dict[str, Any]:
        """Update exchange rates for a base currency"""
        # Create an exchange rate entry
        rate_data = {
            "base_currency": base_currency,
            "rates": rates,
            "timestamp": datetime.now()
        }
        
        # Generate ID for the rate entry
        rate_id = f"{base_currency}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Save to Firestore
        exchange_rates_ref.document(rate_id).set(rate_data)
        
        return rate_data
    
    @staticmethod
    async def get_latest_exchange_rates(base_currency: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get the latest exchange rates for a base currency, or all if not specified"""
        if base_currency:
            # Query for specific base currency, ordered by timestamp
            query = exchange_rates_ref.where(
                filter=firestore.FieldFilter("base_currency", "==", base_currency)
            ).order_by("timestamp", direction=firestore.Query.DESCENDING).limit(1)
        else:
            # Just get the most recent rates of any base currency
            query = exchange_rates_ref.order_by("timestamp", direction=firestore.Query.DESCENDING).limit(1)
        
        docs = query.stream()
        
        for doc in docs:
            return doc.to_dict()
        
        return None
    
    @staticmethod
    async def convert_currency(amount: float, from_currency: str, to_currency: str) -> Dict[str, Any]:
        """Convert an amount from one currency to another"""
        # If same currency, no conversion needed
        if from_currency == to_currency:
            return {
                "original_amount": amount,
                "original_currency": from_currency,
                "converted_amount": amount,
                "converted_currency": to_currency,
                "exchange_rate": 1.0,
                "timestamp": datetime.now()
            }
        
        # Get latest exchange rates for from_currency
        rates = await CurrencyService.get_latest_exchange_rates(from_currency)
        
        # If rates not found, use default rates
        if not rates or to_currency not in rates.get('rates', {}):
            if from_currency in CurrencyService.DEFAULT_RATES and to_currency in CurrencyService.DEFAULT_RATES[from_currency]:
                exchange_rate = CurrencyService.DEFAULT_RATES[from_currency][to_currency]
            else:
                # If no direct conversion is available, go through USD
                # First convert from_currency to USD
                if from_currency != "USD" and from_currency in CurrencyService.DEFAULT_RATES:
                    usd_amount = amount * CurrencyService.DEFAULT_RATES[from_currency]["USD"]
                else:
                    usd_amount = amount  # Already in USD
                
                # Then convert USD to to_currency
                if to_currency != "USD" and "USD" in CurrencyService.DEFAULT_RATES:
                    exchange_rate = CurrencyService.DEFAULT_RATES["USD"][to_currency]
                    converted_amount = usd_amount * exchange_rate
                else:
                    converted_amount = usd_amount  # Convert to USD
                    exchange_rate = 1.0
        else:
            # Use the direct exchange rate
            exchange_rate = rates['rates'][to_currency]
            
        # Calculate converted amount
        converted_amount = amount * exchange_rate
        
        return {
            "original_amount": amount,
            "original_currency": from_currency,
            "converted_amount": converted_amount,
            "converted_currency": to_currency,
            "exchange_rate": exchange_rate,
            "timestamp": datetime.now()
        } 