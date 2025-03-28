from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, date, timedelta
import calendar
from firebase_admin import firestore
from app.core.config import db
from app.services.transaction_service import TransactionService

# Collection reference
recurring_transactions_ref = db.collection('recurring_transactions')

class RecurringTransactionService:
    """Service for managing recurring transactions in Firebase"""
    
    @staticmethod
    async def create(transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new recurring transaction"""
        # Generate a unique ID
        transaction_id = str(uuid.uuid4())
        
        # Convert dates to ISO strings
        if isinstance(transaction_data.get('start_date'), date):
            transaction_data['start_date'] = transaction_data['start_date'].isoformat()
        
        if transaction_data.get('end_date') and isinstance(transaction_data.get('end_date'), date):
            transaction_data['end_date'] = transaction_data['end_date'].isoformat()
        
        # Add metadata
        transaction_data['id'] = transaction_id
        transaction_data['created_at'] = datetime.now().isoformat()
        
        # Save to Firestore
        recurring_transactions_ref.document(transaction_id).set(transaction_data)
        
        return transaction_data
    
    @staticmethod
    async def get_all() -> List[Dict[str, Any]]:
        """Get all recurring transactions"""
        docs = recurring_transactions_ref.stream()
        
        transactions = []
        for doc in docs:
            transaction = doc.to_dict()
            transactions.append(transaction)
            
        return transactions
    
    @staticmethod
    async def get_by_id(transaction_id: str) -> Optional[Dict[str, Any]]:
        """Get a recurring transaction by ID"""
        doc = recurring_transactions_ref.document(transaction_id).get()
        if doc.exists:
            return doc.to_dict()
        return None
    
    @staticmethod
    async def update(transaction_id: str, transaction_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a recurring transaction"""
        transaction_ref = recurring_transactions_ref.document(transaction_id)
        doc = transaction_ref.get()
        
        if not doc.exists:
            return None
        
        # Convert dates to ISO strings
        if isinstance(transaction_data.get('start_date'), date):
            transaction_data['start_date'] = transaction_data['start_date'].isoformat()
        
        if transaction_data.get('end_date') and isinstance(transaction_data.get('end_date'), date):
            transaction_data['end_date'] = transaction_data['end_date'].isoformat()
        
        # Add updated_at timestamp
        transaction_data['updated_at'] = datetime.now().isoformat()
        
        # Update in Firestore
        transaction_ref.update(transaction_data)
        
        # Get and return updated document
        updated_doc = transaction_ref.get()
        return updated_doc.to_dict()
    
    @staticmethod
    async def delete(transaction_id: str) -> bool:
        """Delete a recurring transaction"""
        transaction_ref = recurring_transactions_ref.document(transaction_id)
        doc = transaction_ref.get()
        
        if not doc.exists:
            return False
        
        transaction_ref.delete()
        return True
    
    @staticmethod
    async def generate_transactions() -> Dict[str, Any]:
        """Generate transactions for all recurring transactions 
        that need to be created since their last generation"""
        recurring_transactions = await RecurringTransactionService.get_all()
        
        now = datetime.now().date()
        transactions_created = 0
        errors = []
        
        for recurring in recurring_transactions:
            try:
                # Parse dates
                start_date = datetime.fromisoformat(recurring['start_date']).date()
                end_date = None
                if recurring.get('end_date'):
                    end_date = datetime.fromisoformat(recurring['end_date']).date()
                
                # Skip if end_date is in the past
                if end_date and end_date < now:
                    continue
                
                # Determine the last date a transaction was generated
                last_generated = None
                if recurring.get('last_generated'):
                    last_generated = datetime.fromisoformat(recurring['last_generated']).date()
                else:
                    last_generated = start_date - timedelta(days=1)  # Day before start to include start date
                
                # Determine dates to generate
                dates_to_generate = RecurringTransactionService._get_dates_to_generate(
                    recurring['frequency'],
                    last_generated,
                    now,
                    recurring.get('day_of_week'),
                    recurring.get('day_of_month'),
                    recurring.get('month_of_year'),
                    end_date
                )
                
                # Create transactions for each date
                for generation_date in dates_to_generate:
                    # Skip if date is before start_date or after end_date
                    if generation_date < start_date or (end_date and generation_date > end_date):
                        continue
                    
                    # Create transaction with the date
                    transaction_data = {
                        'amount': recurring['amount'],
                        'category': recurring['category'],
                        'description': recurring['description'],
                        'is_income': recurring['is_income'],
                        'date': generation_date.isoformat(),
                        'recurring_transaction_id': recurring['id']  # Reference to the recurring transaction
                    }
                    
                    await TransactionService.create(transaction_data)
                    transactions_created += 1
                
                # Update last_generated date
                if dates_to_generate:
                    await RecurringTransactionService.update(
                        recurring['id'], 
                        {'last_generated': now.isoformat()}
                    )
                
            except Exception as e:
                errors.append(f"Error processing recurring transaction {recurring.get('id')}: {str(e)}")
                continue
                
        return {
            'transactions_created': transactions_created,
            'errors': errors
        }
    
    @staticmethod
    def _get_dates_to_generate(
        frequency: str,
        last_generated: date,
        current_date: date,
        day_of_week: Optional[int] = None,
        day_of_month: Optional[int] = None,
        month_of_year: Optional[int] = None,
        end_date: Optional[date] = None
    ) -> List[date]:
        """Get dates to generate transactions for based on frequency and last generation date"""
        dates = []
        
        if frequency == 'daily':
            # For daily, generate all days between last_generated and current_date
            delta = current_date - last_generated
            for i in range(1, delta.days + 1):  # +1 to include current_date
                generation_date = last_generated + timedelta(days=i)
                if end_date and generation_date > end_date:
                    break
                dates.append(generation_date)
                
        elif frequency == 'weekly' and day_of_week is not None:
            # For weekly, find all matching days of week between last_generated and current_date
            next_date = last_generated + timedelta(days=1)
            
            # Find the next occurrence of the day of week
            # In Python, weekday() returns 0 for Monday, 6 for Sunday
            # The day_of_week param uses the same convention (0=Monday, 6=Sunday)
            days_ahead = (day_of_week - next_date.weekday()) % 7
            next_date = next_date + timedelta(days=days_ahead)
            
            # Add all weekly occurrences up to current_date
            while next_date <= current_date:
                if end_date and next_date > end_date:
                    break
                dates.append(next_date)
                next_date += timedelta(days=7)
                
        elif frequency == 'monthly' and day_of_month is not None:
            # For monthly, find all matching days of month between last_generated and current_date
            next_month = last_generated.replace(day=1) + timedelta(days=32)
            next_month = next_month.replace(day=1)  # First day of next month
            
            while (next_month.year, next_month.month) <= (current_date.year, current_date.month):
                # Get the correct day, accounting for different month lengths
                last_day = calendar.monthrange(next_month.year, next_month.month)[1]
                day = min(day_of_month, last_day)
                
                try:
                    generation_date = next_month.replace(day=day)
                    if generation_date > last_generated and generation_date <= current_date:
                        if end_date and generation_date > end_date:
                            break
                        dates.append(generation_date)
                except ValueError:
                    # Skip invalid dates (e.g., February 30)
                    pass
                
                # Move to next month
                next_month = (next_month.replace(day=1) + timedelta(days=32)).replace(day=1)
                
        elif frequency == 'yearly' and day_of_month is not None and month_of_year is not None:
            # For yearly, find all matching days in the specified month between last_generated and current_date
            current_year = last_generated.year
            
            while current_year <= current_date.year:
                # Get the correct day, accounting for different month lengths
                last_day = calendar.monthrange(current_year, month_of_year)[1]
                day = min(day_of_month, last_day)
                
                try:
                    generation_date = date(current_year, month_of_year, day)
                    if generation_date > last_generated and generation_date <= current_date:
                        if end_date and generation_date > end_date:
                            break
                        dates.append(generation_date)
                except ValueError:
                    # Skip invalid dates
                    pass
                
                current_year += 1
                
        return dates 