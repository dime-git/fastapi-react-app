from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any

from app.models.budget import BudgetBase, BudgetModel
from app.services.budget_service import BudgetService
from app.services.transaction_service import TransactionService

router = APIRouter(
    prefix="/budgets",
    tags=["budgets"]
)

@router.post("/", response_model=BudgetModel)
async def create_budget(budget: BudgetBase):
    """Create a new budget"""
    # Check if budget already exists for this category
    existing_budget = await BudgetService.get_by_category(budget.category)
    if existing_budget:
        raise HTTPException(status_code=400, detail=f"Budget for category '{budget.category}' already exists")
    
    # Create budget
    budget_data = budget.model_dump()
    result = await BudgetService.create(budget_data)
    return result

@router.get("/", response_model=List[BudgetModel])
async def get_all_budgets():
    """Get all budgets"""
    return await BudgetService.get_all()

@router.get("/{budget_id}", response_model=BudgetModel)
async def get_budget(budget_id: str):
    """Get a budget by ID"""
    budget = await BudgetService.get_by_id(budget_id)
    if not budget:
        raise HTTPException(status_code=404, detail=f"Budget with ID {budget_id} not found")
    return budget

@router.put("/{budget_id}", response_model=BudgetModel)
async def update_budget(budget_id: str, budget_update: BudgetBase):
    """Update a budget"""
    # Check if budget exists
    existing_budget = await BudgetService.get_by_id(budget_id)
    if not existing_budget:
        raise HTTPException(status_code=404, detail=f"Budget with ID {budget_id} not found")
    
    # Update budget
    budget_data = budget_update.model_dump()
    result = await BudgetService.update(budget_id, budget_data)
    return result

@router.delete("/{budget_id}", response_model=dict)
async def delete_budget(budget_id: str):
    """Delete a budget"""
    # Check if budget exists
    existing_budget = await BudgetService.get_by_id(budget_id)
    if not existing_budget:
        raise HTTPException(status_code=404, detail=f"Budget with ID {budget_id} not found")
    
    # Delete budget
    result = await BudgetService.delete(budget_id)
    return {"success": result, "message": "Budget deleted successfully"}

@router.get("/category/{category}", response_model=BudgetModel)
async def get_budget_by_category(category: str):
    """Get a budget by category"""
    budget = await BudgetService.get_by_category(category)
    if not budget:
        raise HTTPException(status_code=404, detail=f"Budget for category '{category}' not found")
    return budget

@router.get("/status/{category}", response_model=Dict[str, Any])
async def get_budget_status(category: str):
    """Get budget status for a category"""
    # Get all transactions for calculating budget status
    transactions = await TransactionService.get_all()
    
    # Calculate budget status
    budget_status = await BudgetService.calculate_budget_status(category, transactions)
    
    if not budget_status:
        raise HTTPException(status_code=404, detail=f"No budget found for category '{category}'")
    
    return budget_status 