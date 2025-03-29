from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class GoalBase(BaseModel):
    """Base model for financial goals"""
    name: str
    target_amount: float
    current_amount: float = 0.0
    currency: str = "USD"
    category: Optional[str] = None
    deadline: Optional[str] = None  # ISO format date string
    description: Optional[str] = None
    
class GoalModel(GoalBase):
    """Model for financial goals with ID and timestamps"""
    id: str
    created_at: str  # ISO format datetime string
    updated_at: Optional[str] = None  # ISO format datetime string
    progress_percentage: float = Field(0.0, ge=0.0, le=100.0)
    is_completed: bool = False
    
class GoalCreate(GoalBase):
    """Model for creating a new financial goal"""
    pass
    
class GoalUpdate(BaseModel):
    """Model for updating an existing financial goal"""
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    currency: Optional[str] = None
    category: Optional[str] = None
    deadline: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None 