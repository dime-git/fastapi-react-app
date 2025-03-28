from pydantic import BaseModel
from typing import Optional
from datetime import date

class RecurringTransactionBase(BaseModel):
    """Base model for recurring transactions"""
    amount: float
    category: str
    description: str
    is_income: bool
    start_date: date
    end_date: Optional[date] = None
    frequency: str  # 'daily', 'weekly', 'monthly', 'yearly'
    day_of_week: Optional[int] = None  # 0-6 (Monday-Sunday) for weekly
    day_of_month: Optional[int] = None  # 1-31 for monthly
    month_of_year: Optional[int] = None  # 1-12 for yearly

class RecurringTransactionModel(RecurringTransactionBase):
    """Model that includes database fields"""
    id: str
    created_at: str
    updated_at: Optional[str] = None
    last_generated: Optional[str] = None 