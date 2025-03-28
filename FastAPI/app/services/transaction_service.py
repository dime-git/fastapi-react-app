from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from firebase_admin import firestore
from app.core.config import db
from app.services.currency_service import CurrencyService

# Collection references
transactions_ref = db.collection('transactions')

class TransactionService:
    """Service for managing transactions in Firebase"""
    
    @staticmethod
    async def create(transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new transaction in Firestore"""
        # Generate a unique ID
        transaction_id = str(uuid.uuid4())
        
        # Add created_at timestamp and ID
        transaction_data['id'] = transaction_id
        transaction_data['created_at'] = datetime.now().isoformat()
        
        # If currency is not specified, use the default currency
        if 'currency' not in transaction_data:
            default_currency = await CurrencyService.get_default_currency()
            transaction_data['currency'] = default_currency['code']
        
        # Save to Firestore
        transactions_ref.document(transaction_id).set(transaction_data)
        
        return transaction_data
    
    @staticmethod
    async def get_all(limit: int = 100, target_currency: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all transactions with optional limit and currency conversion"""
        query = transactions_ref.limit(limit)
        docs = query.stream()
        
        transactions = []
        for doc in docs:
            transaction = doc.to_dict()
            
            # Convert currency if target_currency is specified and different from transaction currency
            if target_currency and transaction.get('currency') != target_currency:
                conversion = await CurrencyService.convert_currency(
                    transaction['amount'],
                    transaction['currency'],
                    target_currency
                )
                
                # Store original values
                transaction['original_amount'] = transaction['amount']
                transaction['original_currency'] = transaction['currency']
                
                # Update with converted values
                transaction['amount'] = conversion['converted_amount']
                transaction['currency'] = target_currency
            
            transactions.append(transaction)
            
        return transactions
    
    @staticmethod
    async def get_by_id(transaction_id: str, target_currency: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get a transaction by ID with optional currency conversion"""
        doc = transactions_ref.document(transaction_id).get()
        if not doc.exists:
            return None
            
        transaction = doc.to_dict()
        
        # Convert currency if target_currency is specified and different from transaction currency
        if target_currency and transaction.get('currency') != target_currency:
            conversion = await CurrencyService.convert_currency(
                transaction['amount'],
                transaction['currency'],
                target_currency
            )
            
            # Store original values
            transaction['original_amount'] = transaction['amount']
            transaction['original_currency'] = transaction['currency']
            
            # Update with converted values
            transaction['amount'] = conversion['converted_amount']
            transaction['currency'] = target_currency
        
        return transaction
    
    @staticmethod
    async def update(transaction_id: str, transaction_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a transaction"""
        transaction_ref = transactions_ref.document(transaction_id)
        doc = transaction_ref.get()
        
        if not doc.exists:
            return None
        
        # Add updated_at timestamp
        transaction_data['updated_at'] = datetime.now().isoformat()
        
        # Update in Firestore
        transaction_ref.update(transaction_data)
        
        # Get and return updated document
        updated_doc = transaction_ref.get()
        return updated_doc.to_dict()
    
    @staticmethod
    async def delete(transaction_id: str) -> bool:
        """Delete a transaction"""
        transaction_ref = transactions_ref.document(transaction_id)
        doc = transaction_ref.get()
        
        if not doc.exists:
            return False
        
        transaction_ref.delete()
        return True
        
    @staticmethod
    async def get_by_category(category: str, target_currency: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get transactions by category with optional currency conversion"""
        query = transactions_ref.where(filter=firestore.FieldFilter("category", "==", category))
        docs = query.stream()
        
        transactions = []
        for doc in docs:
            transaction = doc.to_dict()
            
            # Convert currency if target_currency is specified and different from transaction currency
            if target_currency and transaction.get('currency') != target_currency:
                conversion = await CurrencyService.convert_currency(
                    transaction['amount'],
                    transaction['currency'],
                    target_currency
                )
                
                # Store original values
                transaction['original_amount'] = transaction['amount']
                transaction['original_currency'] = transaction['currency']
                
                # Update with converted values
                transaction['amount'] = conversion['converted_amount']
                transaction['currency'] = target_currency
            
            transactions.append(transaction)
            
        return transactions 