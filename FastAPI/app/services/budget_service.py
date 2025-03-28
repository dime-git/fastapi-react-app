from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from firebase_admin import firestore
from app.core.config import db

# Collection reference
budgets_ref = db.collection('budgets')

class BudgetService:
    """Service for managing budgets in Firebase"""
    
    @staticmethod
    async def create(budget_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new budget in Firestore"""
        # Generate a unique ID
        budget_id = str(uuid.uuid4())
        
        # Add created_at timestamp and ID
        budget_data['id'] = budget_id
        budget_data['created_at'] = datetime.now().isoformat()
        
        # Save to Firestore
        budgets_ref.document(budget_id).set(budget_data)
        
        return budget_data
    
    @staticmethod
    async def get_all() -> List[Dict[str, Any]]:
        """Get all budgets"""
        docs = budgets_ref.stream()
        
        budgets = []
        for doc in docs:
            budget = doc.to_dict()
            budgets.append(budget)
            
        return budgets
    
    @staticmethod
    async def get_by_category(category: str) -> Optional[Dict[str, Any]]:
        """Get a budget by category"""
        query = budgets_ref.where(filter=firestore.FieldFilter("category", "==", category)).limit(1)
        docs = query.stream()
        
        for doc in docs:
            return doc.to_dict()
        
        return None
    
    @staticmethod
    async def get_by_id(budget_id: str) -> Optional[Dict[str, Any]]:
        """Get a budget by ID"""
        doc = budgets_ref.document(budget_id).get()
        if doc.exists:
            return doc.to_dict()
        return None
    
    @staticmethod
    async def update(budget_id: str, budget_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a budget"""
        budget_ref = budgets_ref.document(budget_id)
        doc = budget_ref.get()
        
        if not doc.exists:
            return None
        
        # Add updated_at timestamp
        budget_data['updated_at'] = datetime.now().isoformat()
        
        # Update in Firestore
        budget_ref.update(budget_data)
        
        # Get and return updated document
        updated_doc = budget_ref.get()
        return updated_doc.to_dict()
    
    @staticmethod
    async def delete(budget_id: str) -> bool:
        """Delete a budget"""
        budget_ref = budgets_ref.document(budget_id)
        doc = budget_ref.get()
        
        if not doc.exists:
            return False
        
        budget_ref.delete()
        return True
    
    @staticmethod
    async def calculate_budget_status(category: str, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate budget status for a category based on transactions
        
        Returns a dict with:
        - budget_amount: the total budget amount
        - spent_amount: how much has been spent in this category
        - remaining_amount: how much remains in the budget
        - percentage_used: what percentage of the budget has been used
        - status: 'under', 'approaching', 'exceeded'
        """
        # Get the budget for this category
        budget = await BudgetService.get_by_category(category)
        
        if not budget:
            return None
        
        # Filter transactions for current month and category
        now = datetime.now()
        current_month = now.month
        current_year = now.year
        
        monthly_transactions = [
            t for t in transactions 
            if t['category'] == category 
            and not t['is_income']
            and datetime.fromisoformat(t['date']).month == current_month
            and datetime.fromisoformat(t['date']).year == current_year
        ]
        
        # Calculate spent amount
        spent_amount = sum(t['amount'] for t in monthly_transactions)
        
        # Calculate remaining and percentage
        remaining_amount = budget['amount'] - spent_amount
        percentage_used = (spent_amount / budget['amount']) * 100 if budget['amount'] > 0 else 0
        
        # Determine status
        status = 'under'
        if percentage_used >= 90:
            status = 'exceeded'
        elif percentage_used >= 75:
            status = 'approaching'
        
        return {
            'budget_amount': budget['amount'],
            'spent_amount': spent_amount,
            'remaining_amount': remaining_amount,
            'percentage_used': percentage_used,
            'status': status
        } 