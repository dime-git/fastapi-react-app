from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from firebase_admin import firestore
from app.core.config import db
from app.services.currency_service import CurrencyService

# Collection reference
goals_ref = db.collection('goals')

class GoalService:
    """Service for managing financial goals in Firebase"""
    
    @staticmethod
    async def create(goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new financial goal in Firestore"""
        # Generate a unique ID
        goal_id = str(uuid.uuid4())
        
        # Add metadata
        goal_data['id'] = goal_id
        goal_data['created_at'] = datetime.now().isoformat()
        
        # If currency is not specified, use the default currency
        if 'currency' not in goal_data:
            default_currency = await CurrencyService.get_default_currency()
            goal_data['currency'] = default_currency['code']
            
        # Calculate progress percentage
        if 'target_amount' in goal_data and 'current_amount' in goal_data and goal_data['target_amount'] > 0:
            goal_data['progress_percentage'] = min(100.0, (goal_data['current_amount'] / goal_data['target_amount']) * 100)
        else:
            goal_data['progress_percentage'] = 0.0
            
        # Set completion status
        goal_data['is_completed'] = goal_data.get('progress_percentage', 0.0) >= 100.0
        
        # Save to Firestore
        goals_ref.document(goal_id).set(goal_data)
        
        return goal_data
    
    @staticmethod
    async def get_all(limit: int = 100, target_currency: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all financial goals with optional limit and currency conversion"""
        query = goals_ref.limit(limit)
        docs = query.stream()
        
        goals = []
        for doc in docs:
            goal = doc.to_dict()
            
            # Ensure goal has a currency field
            if 'currency' not in goal:
                default_currency = await CurrencyService.get_default_currency()
                goal['currency'] = default_currency['code']
                
                # Update the goal in Firestore with the default currency
                goals_ref.document(goal['id']).update({
                    'currency': goal['currency']
                })
            
            # Convert currency if target_currency is specified and different from goal currency
            if target_currency and goal.get('currency') != target_currency:
                try:
                    # Convert target amount
                    conversion_target = await CurrencyService.convert_currency(
                        goal['target_amount'],
                        goal['currency'],
                        target_currency
                    )
                    
                    # Convert current amount
                    conversion_current = await CurrencyService.convert_currency(
                        goal['current_amount'],
                        goal['currency'],
                        target_currency
                    )
                    
                    # Store original values
                    goal['original_target_amount'] = goal['target_amount']
                    goal['original_current_amount'] = goal['current_amount']
                    goal['original_currency'] = goal['currency']
                    
                    # Update with converted values
                    goal['target_amount'] = conversion_target['converted_amount']
                    goal['current_amount'] = conversion_current['converted_amount']
                    goal['currency'] = target_currency
                    
                except Exception as e:
                    # If conversion fails, keep original values
                    print(f"Currency conversion error: {e}")
            
            goals.append(goal)
            
        return goals
    
    @staticmethod
    async def get_by_id(goal_id: str, target_currency: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get a goal by ID with optional currency conversion"""
        doc = goals_ref.document(goal_id).get()
        if not doc.exists:
            return None
            
        goal = doc.to_dict()
        
        # Ensure goal has a currency field
        if 'currency' not in goal:
            default_currency = await CurrencyService.get_default_currency()
            goal['currency'] = default_currency['code']
            
            # Update the goal in Firestore with the default currency
            goals_ref.document(goal_id).update({
                'currency': goal['currency']
            })
        
        # Convert currency if target_currency is specified and different from goal currency
        if target_currency and goal.get('currency') != target_currency:
            try:
                # Convert target amount
                conversion_target = await CurrencyService.convert_currency(
                    goal['target_amount'],
                    goal['currency'],
                    target_currency
                )
                
                # Convert current amount
                conversion_current = await CurrencyService.convert_currency(
                    goal['current_amount'],
                    goal['currency'],
                    target_currency
                )
                
                # Store original values
                goal['original_target_amount'] = goal['target_amount']
                goal['original_current_amount'] = goal['current_amount']
                goal['original_currency'] = goal['currency']
                
                # Update with converted values
                goal['target_amount'] = conversion_target['converted_amount']
                goal['current_amount'] = conversion_current['converted_amount']
                goal['currency'] = target_currency
                
            except Exception as e:
                # If conversion fails, keep original values
                print(f"Currency conversion error: {e}")
        
        return goal
    
    @staticmethod
    async def update(goal_id: str, goal_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a goal"""
        goal_ref = goals_ref.document(goal_id)
        doc = goal_ref.get()
        
        if not doc.exists:
            return None
            
        existing_goal = doc.to_dict()
        
        # Add updated_at timestamp
        goal_data['updated_at'] = datetime.now().isoformat()
        
        # Calculate progress percentage if required fields are present
        if 'target_amount' in goal_data or 'current_amount' in goal_data:
            target = goal_data.get('target_amount', existing_goal.get('target_amount', 0))
            current = goal_data.get('current_amount', existing_goal.get('current_amount', 0))
            
            if target > 0:
                goal_data['progress_percentage'] = min(100.0, (current / target) * 100)
                
                # Update completion status based on new progress
                goal_data['is_completed'] = goal_data['progress_percentage'] >= 100.0
        
        # Update in Firestore
        goal_ref.update(goal_data)
        
        # Get and return updated document
        updated_doc = goal_ref.get()
        return updated_doc.to_dict()
    
    @staticmethod
    async def delete(goal_id: str) -> bool:
        """Delete a goal"""
        goal_ref = goals_ref.document(goal_id)
        doc = goal_ref.get()
        
        if not doc.exists:
            return False
        
        goal_ref.delete()
        return True
        
    @staticmethod
    async def contribute(goal_id: str, amount: float) -> Optional[Dict[str, Any]]:
        """Add a contribution to a goal"""
        goal_ref = goals_ref.document(goal_id)
        doc = goal_ref.get()
        
        if not doc.exists:
            return None
            
        existing_goal = doc.to_dict()
        
        # Update current amount
        current_amount = existing_goal.get('current_amount', 0) + amount
        target_amount = existing_goal.get('target_amount', 0)
        
        # Calculate new progress percentage
        progress_percentage = 0.0
        if target_amount > 0:
            progress_percentage = min(100.0, (current_amount / target_amount) * 100)
        
        # Determine if goal is completed
        is_completed = progress_percentage >= 100.0
        
        # Update the goal
        updates = {
            'current_amount': current_amount,
            'progress_percentage': progress_percentage,
            'is_completed': is_completed,
            'updated_at': datetime.now().isoformat()
        }
        
        goal_ref.update(updates)
        
        # Get and return updated document
        updated_doc = goal_ref.get()
        return updated_doc.to_dict()
        
    @staticmethod
    async def get_by_category(category: str, target_currency: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get goals by category with optional currency conversion"""
        query = goals_ref.where(filter=firestore.FieldFilter("category", "==", category))
        docs = query.stream()
        
        goals = []
        for doc in docs:
            goal = doc.to_dict()
            
            # Convert currency if needed (using the same conversion logic as in get_all)
            if target_currency and goal.get('currency') != target_currency:
                try:
                    # Convert target amount
                    conversion_target = await CurrencyService.convert_currency(
                        goal['target_amount'],
                        goal['currency'],
                        target_currency
                    )
                    
                    # Convert current amount
                    conversion_current = await CurrencyService.convert_currency(
                        goal['current_amount'],
                        goal['currency'],
                        target_currency
                    )
                    
                    # Store original values
                    goal['original_target_amount'] = goal['target_amount']
                    goal['original_current_amount'] = goal['current_amount']
                    goal['original_currency'] = goal['currency']
                    
                    # Update with converted values
                    goal['target_amount'] = conversion_target['converted_amount']
                    goal['current_amount'] = conversion_current['converted_amount']
                    goal['currency'] = target_currency
                    
                except Exception as e:
                    # If conversion fails, keep original values
                    print(f"Currency conversion error: {e}")
            
            goals.append(goal)
            
        return goals 