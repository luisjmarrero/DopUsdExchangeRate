from datetime import datetime
from pydantic import BaseModel
from typing import List

class ExchangeRate(BaseModel):
    bank: str
    buy_rate: float
    sell_rate: float
    sync_date: datetime
    source: str
    disabled: bool = False

class ExchangeRateList(BaseModel):
    rates: List[ExchangeRate]
