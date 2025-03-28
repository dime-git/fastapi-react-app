from fastapi import FastAPI, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import re
from firebase_models import FirebaseTransaction

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def format_category(category: str) -> str:
    """Format category string with proper spacing between words."""
    # Use regex to insert spaces between lowercase followed by uppercase/numbers
    formatted = re.sub(r'([a-z])([A-Z0-9])', r'\1 \2', category)
    # Insert space between end of word and beginning of new one
    return formatted

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

@app.post("/transactions/", response_model=TransactionModel)
async def create_transaction(transaction: TransactionBase):
    # Format the category before saving
    transaction_dict = transaction.model_dump()
    transaction_dict["category"] = format_category(transaction_dict["category"])
    
    # Create transaction in Firebase
    created_transaction = await FirebaseTransaction.create(transaction_dict)
    return created_transaction


@app.get("/transactions/", response_model=List[TransactionModel])
async def get_transactions(skip: int = 0, limit: int = 100):
    transactions = await FirebaseTransaction.get_all(limit=limit)
    return transactions

# Add an alternative route without the trailing slash
@app.get("/transactions", response_model=List[TransactionModel])
async def get_transactions_alt(skip: int = 0, limit: int = 100):
    return await get_transactions(skip=skip, limit=limit)

# Add an alternative route without the trailing slash for POST
@app.post("/transactions", response_model=TransactionModel)
async def create_transaction_alt(transaction: TransactionBase):
    return await create_transaction(transaction)

@app.get("/transactions/{transaction_id}", response_model=TransactionModel)
async def get_transaction(transaction_id: str):
    transaction = await FirebaseTransaction.get_by_id(transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@app.put("/transactions/{transaction_id}", response_model=TransactionModel)
async def update_transaction(transaction_id: str, transaction: TransactionBase):
    # Format the category before saving
    transaction_dict = transaction.model_dump()
    transaction_dict["category"] = format_category(transaction_dict["category"])
    
    updated_transaction = await FirebaseTransaction.update(transaction_id, transaction_dict)
    if updated_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return updated_transaction

@app.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    success = await FirebaseTransaction.delete(transaction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"detail": "Transaction deleted successfully"}




