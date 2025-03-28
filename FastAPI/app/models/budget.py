from pydantic import BaseModel
from typing import Optional

class BudgetBase(BaseModel):
    category: str
    amount: float
    period: str  # 'monthly', 'weekly', 'yearly'

class BudgetModel(BudgetBase):
    id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None 