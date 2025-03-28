from fastapi import APIRouter, HTTPException
from typing import List
from app.models.transaction import TransactionBase, TransactionModel
from app.services.transaction_service import TransactionService
from app.utils.formatting import format_category

router = APIRouter()

@router.post("/", response_model=TransactionModel)
async def create_transaction(transaction: TransactionBase):
    # Format the category before saving
    transaction_dict = transaction.model_dump()
    transaction_dict["category"] = format_category(transaction_dict["category"])
    
    # Create transaction in Firebase
    created_transaction = await TransactionService.create(transaction_dict)
    return created_transaction


@router.get("/", response_model=List[TransactionModel])
async def get_transactions(skip: int = 0, limit: int = 100):
    transactions = await TransactionService.get_all(limit=limit)
    return transactions

@router.get("/{transaction_id}", response_model=TransactionModel)
async def get_transaction(transaction_id: str):
    transaction = await TransactionService.get_by_id(transaction_id)
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