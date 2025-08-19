
from app.models_db import ExchangeRateDB
from app.database import SessionLocal
from datetime import datetime

def create_rate(bank: str, buy_rate: float, sell_rate: float):
	db = SessionLocal()
	db_rate = ExchangeRateDB(
		bank=bank,
		buy_rate=buy_rate,
		sell_rate=sell_rate,
		sync_date=datetime.now()
	)
	db.add(db_rate)
	db.commit()
	db.refresh(db_rate)
	db.close()
	return db_rate

def get_latest_rates():
	db = SessionLocal()
	rates = db.query(ExchangeRateDB).order_by(ExchangeRateDB.buy_rate.asc()).all()
	db.close()
	return rates
