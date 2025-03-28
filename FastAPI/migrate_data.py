"""
Script to migrate data from SQLite to Firebase Firestore.
Run this once to transfer all your transaction data.
"""
import asyncio
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from app.core.config import db
import uuid
from datetime import datetime

# Collection references
transactions_ref = db.collection('transactions')

def get_db():
    db = SessionLocal()
    try:
        return db
    finally:
        db.close()

async def migrate_data():
    print("Starting migration from SQLite to Firebase...")
    
    # Get data from SQLite
    db = get_db()
    transactions = db.query(models.Transaction).all()
    
    print(f"Found {len(transactions)} transactions to migrate")
    
    # Migrate each transaction to Firebase
    for transaction in transactions:
        transaction_id = str(uuid.uuid4())
        
        # Convert SQLAlchemy model to dict
        transaction_data = {
            "id": transaction_id,
            "amount": float(transaction.amount),
            "category": transaction.category,
            "description": transaction.description,
            "is_income": bool(transaction.is_income),
            "date": transaction.date,
            "created_at": datetime.now().isoformat(),
        }
        
        # Save to Firestore
        transactions_ref.document(transaction_id).set(transaction_data)
        print(f"Migrated transaction: {transaction_id}")
    
    print("Migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(migrate_data()) 