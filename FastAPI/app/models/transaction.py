from pydantic import BaseModel
from typing import Optional

class TransactionBase(BaseModel):
    amount: float
    category: str
    description: str
    is_income: bool
    date: str

class TransactionModel(TransactionBase):
    id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None 