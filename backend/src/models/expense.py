from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ExpenseBase(BaseModel):
    date: datetime
    description: str
    category: str
    amount: float
    currency: str

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int

    class Config:
        from_attributes = True

class ExpenseResponse(BaseModel):
    expenses: List[Expense]
    total_spent: float
    average_spent: float 