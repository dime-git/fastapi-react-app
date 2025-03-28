from firebase_config import db, transactions_ref
from google.cloud.firestore_v1.base_query import FieldFilter
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

class FirebaseTransaction:
    """Data access class for transactions in Firebase"""
    
    @staticmethod
    async def create(transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new transaction in Firestore"""
        # Generate a unique ID
        transaction_id = str(uuid.uuid4())
        
        # Add created_at timestamp and ID
        transaction_data['id'] = transaction_id
        transaction_data['created_at'] = datetime.now().isoformat()
        
        # Save to Firestore
        transactions_ref.document(transaction_id).set(transaction_data)
        
        return transaction_data
    
    @staticmethod
    async def get_all(limit: int = 100) -> List[Dict[str, Any]]:
        """Get all transactions with optional limit"""
        query = transactions_ref.limit(limit)
        docs = query.stream()
        
        transactions = []
        for doc in docs:
            transaction = doc.to_dict()
            transactions.append(transaction)
            
        return transactions
    
    @staticmethod
    async def get_by_id(transaction_id: str) -> Optional[Dict[str, Any]]:
        """Get a transaction by ID"""
        doc = transactions_ref.document(transaction_id).get()
        if doc.exists:
            return doc.to_dict()
        return None
    
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
    async def get_by_category(category: str) -> List[Dict[str, Any]]:
        """Get transactions by category"""
        query = transactions_ref.where(filter=FieldFilter("category", "==", category))
        docs = query.stream()
        
        transactions = []
        for doc in docs:
            transaction = doc.to_dict()
            transactions.append(transaction)
            
        return transactions 