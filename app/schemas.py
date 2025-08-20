from pydantic import BaseModel

class Bank(BaseModel):
    id: int
    name: str
    disabled: bool = False
from pydantic import BaseModel
from datetime import datetime

class Rate(BaseModel):
    bank: str
    buy_rate: float
    sell_rate: float
    sync_date: datetime
    source: str
    disabled: bool = False

class BankStatusUpdate(BaseModel):
    disabled: bool