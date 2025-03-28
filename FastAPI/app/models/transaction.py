from pydantic import BaseModel
from typing import Optional

class TransactionBase(BaseModel):
    amount: float
    category: str
    description: str
    is_income: bool
    date: str
    currency: str = "USD"  # Default to USD

class TransactionModel(TransactionBase):
    id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    # If the transaction was converted from another currency
    original_amount: Optional[float] = None
    original_currency: Optional[str] = None 