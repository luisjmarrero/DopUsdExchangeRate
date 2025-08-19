
from fastapi import FastAPI, HTTPException
from fastapi import BackgroundTasks
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from app.models import ExchangeRate
from app.models_db import ExchangeRateDB
from app.database import SessionLocal, engine
from app.constants import SUPPORTED_BANKS
from app.utils import validate_bank
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import app.scraper as scraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
app = FastAPI()
scheduler = BackgroundScheduler()

@app.get("/health")
def health():
	return {"status": "ok"}

def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()


def sync_rates_job():
	logger.info("Starting sync_rates job...")
	results = []
	db = SessionLocal()
	from app.models_db import BankDB
	enabled_banks = [b.name for b in db.query(BankDB).filter(BankDB.disabled == False).all()]
	db.close()
	for bank in enabled_banks:
		logger.info(f"Syncing rates for bank: {bank}")
		rate = scraper.get_bank_rate(bank)
		if rate:
			db = SessionLocal()
			db_rate = ExchangeRateDB(
				bank=bank,
				buy_rate=rate['buy_rate'],
				sell_rate=rate['sell_rate'],
				sync_date=datetime.now(),
				source=rate.get('source', 'scraper')
			)
			db.add(db_rate)
			db.commit()
			db.refresh(db_rate)
			db.close()
			results.append(db_rate)
			logger.info(f"Rates for {bank} synced: buy={rate['buy_rate']}, sell={rate['sell_rate']}, source={db_rate.source}")
		else:
			logger.warning(f"No rates found for {bank}")
	logger.info(f"Sync job complete. Banks synced: {len(results)}")

@app.post("/sync")
async def sync_rates(background_tasks: BackgroundTasks):
	background_tasks.add_task(sync_rates_job)
	return {"status": "accepted"}

# Schedule sync_rates to run daily at 8:00am
def start_scheduler():
	scheduler.add_job(sync_rates_job, 'cron', hour=8, minute=0)
	scheduler.start()

@app.on_event("startup")
def on_startup():
	start_scheduler()

@app.get("/rates", response_model=List[ExchangeRate])
def get_rates():
		logger.info("Fetching latest rates for all banks...")
		db = SessionLocal()
		latest_rates = []
		for bank in SUPPORTED_BANKS:
			rate = db.query(ExchangeRateDB).filter(ExchangeRateDB.bank == bank).order_by(ExchangeRateDB.sync_date.desc()).first()
			if rate:
				latest_rates.append(ExchangeRate(
					bank=rate.bank,
					buy_rate=rate.buy_rate,
					sell_rate=rate.sell_rate,
					sync_date=rate.sync_date,
					source=rate.source if rate.source is not None else ""
				))
				logger.info(f"Latest rate for {bank}: buy={rate.buy_rate}, sell={rate.sell_rate}, source={rate.source}")
			else:
				logger.warning(f"No rate found for {bank}")
		db.close()
		return latest_rates

@app.get("/rates/{bank}", response_model=List[ExchangeRate])
def get_bank_rates(bank: str):
	if not validate_bank(bank):
		raise HTTPException(status_code=404, detail="Bank not supported")
	db = SessionLocal()
	rates = db.query(ExchangeRateDB).filter(ExchangeRateDB.bank == bank).order_by(ExchangeRateDB.buy_rate.asc()).all()
	db.close()
	return [ExchangeRate(
		bank=r.bank,
		buy_rate=r.buy_rate,
		sell_rate=r.sell_rate,
		sync_date=r.sync_date,
		source=r.source if r.source is not None else ""
	) for r in rates]

@app.get("/banks")
def get_banks():
	db = SessionLocal()
	from app.models_db import BankDB
	banks = db.query(BankDB).all()
	db.close()
	return {"banks": [{"name": b.name, "disabled": b.disabled} for b in banks]}

@app.post("/calculate/buy/{dop_ammount}")
def calculate_buy(dop_ammount: float):
	db = SessionLocal()
	rates = db.query(ExchangeRateDB).order_by(ExchangeRateDB.buy_rate.asc()).all()
	db.close()
	results = []
	for r in rates:
		usd = dop_ammount / r.buy_rate if r.buy_rate else 0
		results.append({"bank": r.bank, "usd": round(usd, 2), "buy_rate": r.buy_rate})
	results.sort(key=lambda x: x["usd"], reverse=True)
	return results

@app.post("/calculate/sell/{usd_ammount}")
def calculate_sell(usd_ammount: float):
	db = SessionLocal()
	rates = db.query(ExchangeRateDB).order_by(ExchangeRateDB.sell_rate.desc()).all()
	db.close()
	results = []
	for r in rates:
		dop = usd_ammount * r.sell_rate if r.sell_rate else 0
		results.append({"bank": r.bank, "dop": round(dop, 2), "sell_rate": r.sell_rate})
	results.sort(key=lambda x: x["dop"], reverse=True)
	return results
