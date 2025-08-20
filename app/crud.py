from app.models_db import ExchangeRateDB, BankDB
from app.database import SessionLocal
from datetime import datetime
import zoneinfo
from app.constants import DEFAULT_TIMEZONE

tz = zoneinfo.ZoneInfo(DEFAULT_TIMEZONE)

def create_rate(bank: str, buy_rate: float, sell_rate: float):
    db = SessionLocal()
    db_rate = ExchangeRateDB(
        bank=bank,
        buy_rate=buy_rate,
        sell_rate=sell_rate,
        sync_date=datetime.now(tz)
    )
    db.add(db_rate)
    db.commit()
    db.refresh(db_rate)
    db.close()
    return db_rate

def get_all_rates_ordered(sort_by: str = 'sync_date', order: str = 'desc'):
    db = SessionLocal()
    # Map sort_by to column
    sort_columns = {
        'bank': ExchangeRateDB.bank,
        'buy_rate': ExchangeRateDB.buy_rate,
        'sell_rate': ExchangeRateDB.sell_rate,
        'sync_date': ExchangeRateDB.sync_date,
        'source': ExchangeRateDB.source
    }
    sort_col = sort_columns.get(sort_by, ExchangeRateDB.sync_date)
    if order == 'desc':
        sort_col = sort_col.desc()
    else:
        sort_col = sort_col.asc()
    rates = db.query(ExchangeRateDB).order_by(sort_col, ExchangeRateDB.bank.asc()).all()
    db.close()
    return rates

def get_latest_rates():
    db = SessionLocal()
    rates = db.query(ExchangeRateDB).order_by(ExchangeRateDB.buy_rate.asc()).all()
    db.close()
    return rates

def update_bank_status(bank_name: str, disabled: bool):
    db = SessionLocal()
    bank = db.query(BankDB).filter(BankDB.name == bank_name).first()
    if bank:
        bank.disabled = disabled
        db.commit()
        db.refresh(bank)
    db.close()
    return bank
