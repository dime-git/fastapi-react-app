from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Any

from app.models.recurring_transaction import RecurringTransactionBase, RecurringTransactionModel
from app.services.recurring_transaction_service import RecurringTransactionService
from app.utils.formatting import format_category

router = APIRouter(
    prefix="/recurring-transactions",
    tags=["recurring-transactions"]
)

@router.post("/", response_model=RecurringTransactionModel)
async def create_recurring_transaction(transaction: RecurringTransactionBase):
    """Create a new recurring transaction"""
    # Format the category before saving
    transaction_dict = transaction.model_dump()
    transaction_dict["category"] = format_category(transaction_dict["category"])
    
    # Validate based on frequency type
    validate_frequency_params(transaction_dict)
    
    # Create recurring transaction
    result = await RecurringTransactionService.create(transaction_dict)
    return result

@router.get("/", response_model=List[RecurringTransactionModel])
async def get_all_recurring_transactions():
    """Get all recurring transactions"""
    return await RecurringTransactionService.get_all()

@router.get("/{transaction_id}", response_model=RecurringTransactionModel)
async def get_recurring_transaction(transaction_id: str):
    """Get a recurring transaction by ID"""
    transaction = await RecurringTransactionService.get_by_id(transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail=f"Recurring transaction with ID {transaction_id} not found")
    return transaction

@router.put("/{transaction_id}", response_model=RecurringTransactionModel)
async def update_recurring_transaction(transaction_id: str, transaction_update: RecurringTransactionBase):
    """Update a recurring transaction"""
    # Check if transaction exists
    existing_transaction = await RecurringTransactionService.get_by_id(transaction_id)
    if not existing_transaction:
        raise HTTPException(status_code=404, detail=f"Recurring transaction with ID {transaction_id} not found")
    
    # Format the category before saving
    transaction_dict = transaction_update.model_dump()
    transaction_dict["category"] = format_category(transaction_dict["category"])
    
    # Validate based on frequency type
    validate_frequency_params(transaction_dict)
    
    # Update recurring transaction
    result = await RecurringTransactionService.update(transaction_id, transaction_dict)
    return result

@router.delete("/{transaction_id}", response_model=dict)
async def delete_recurring_transaction(transaction_id: str):
    """Delete a recurring transaction"""
    # Check if transaction exists
    existing_transaction = await RecurringTransactionService.get_by_id(transaction_id)
    if not existing_transaction:
        raise HTTPException(status_code=404, detail=f"Recurring transaction with ID {transaction_id} not found")
    
    # Delete recurring transaction
    result = await RecurringTransactionService.delete(transaction_id)
    return {"success": result, "message": "Recurring transaction deleted successfully"}

@router.post("/generate", response_model=Dict[str, Any])
async def generate_transactions(background_tasks: BackgroundTasks):
    """Generate transactions from recurring transactions"""
    # Run the generation process in the background
    background_tasks.add_task(RecurringTransactionService.generate_transactions)
    return {"status": "success", "message": "Transaction generation started in the background"}

@router.post("/generate-now", response_model=Dict[str, Any])
async def generate_transactions_now():
    """Generate transactions from recurring transactions immediately"""
    result = await RecurringTransactionService.generate_transactions()
    return result

def validate_frequency_params(transaction_dict: Dict[str, Any]):
    """Validate the params needed for each frequency type"""
    frequency = transaction_dict.get("frequency")
    
    if frequency == "weekly" and transaction_dict.get("day_of_week") is None:
        raise HTTPException(status_code=400, detail="day_of_week is required for weekly frequency")
    
    if frequency == "monthly" and transaction_dict.get("day_of_month") is None:
        raise HTTPException(status_code=400, detail="day_of_month is required for monthly frequency")
    
    if frequency == "yearly":
        if transaction_dict.get("day_of_month") is None:
            raise HTTPException(status_code=400, detail="day_of_month is required for yearly frequency")
        if transaction_dict.get("month_of_year") is None:
            raise HTTPException(status_code=400, detail="month_of_year is required for yearly frequency") 