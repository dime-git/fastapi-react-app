from fastapi import APIRouter, HTTPException
from typing import List
from app.models.transaction import TransactionBase, TransactionModel
from app.services.transaction_service import TransactionService
from app.services.currency_service import CurrencyService
from app.utils.formatting import format_category

router = APIRouter(
    prefix="/transactions",
    tags=["transactions"]
)

@router.post("/", response_model=TransactionModel)
async def create_transaction(transaction: TransactionBase):
    # Format the category before saving
    transaction_dict = transaction.model_dump()
    transaction_dict["category"] = format_category(transaction_dict["category"])
    
    # Create transaction in Firebase
    created_transaction = await TransactionService.create(transaction_dict)
    return created_transaction


@router.get("/", response_model=List[TransactionModel])
async def get_transactions(skip: int = 0, limit: int = 100, currency: str = None):
    """Get all transactions with optional currency conversion"""
    transactions = await TransactionService.get_all(limit=limit, target_currency=currency)
    return transactions

@router.get("/{transaction_id}", response_model=TransactionModel)
async def get_transaction(transaction_id: str, currency: str = None):
    """Get a transaction by ID with optional currency conversion"""
    transaction = await TransactionService.get_by_id(transaction_id, target_currency=currency)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.put("/{transaction_id}", response_model=TransactionModel)
async def update_transaction(transaction_id: str, transaction: TransactionBase):
    # Format the category before saving
    transaction_dict = transaction.model_dump()
    transaction_dict["category"] = format_category(transaction_dict["category"])
    
    updated_transaction = await TransactionService.update(transaction_id, transaction_dict)
    if updated_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return updated_transaction

@router.delete("/{transaction_id}")
async def delete_transaction(transaction_id: str):
    success = await TransactionService.delete(transaction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"detail": "Transaction deleted successfully"}

@router.get("/category/{category}", response_model=List[TransactionModel])
async def get_transactions_by_category(category: str, currency: str = None):
    """Get transactions by category with optional currency conversion"""
    formatted_category = format_category(category)
    transactions = await TransactionService.get_by_category(formatted_category, target_currency=currency)
    return transactions 