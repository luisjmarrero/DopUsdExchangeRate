from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class BankDB(Base):
    __tablename__ = "banks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    disabled = Column(Boolean, default=False)
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from .database import Base

class ExchangeRateDB(Base):
    __tablename__ = "exchange_rates"
    id = Column(Integer, primary_key=True, index=True)
    bank = Column(String, index=True)
    buy_rate = Column(Float)
    sell_rate = Column(Float)
    sync_date = Column(DateTime)
    source = Column(String)
    disabled = Column(Boolean, default=False)
