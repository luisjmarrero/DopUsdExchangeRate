from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from app.models import ExchangeRate
from app.models_db import ExchangeRateDB
from app.database import SessionLocal, engine
from app.constants import SUPPORTED_BANKS, DEFAULT_TIMEZONE
from app.utils import validate_bank
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import zoneinfo
import app.scraper as scraper
import app.crud as crud
from app.schemas import BankStatusUpdate
import subprocess
from fastapi.responses import JSONResponse
import os
import sys

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to ["http://localhost:5174"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
tz = zoneinfo.ZoneInfo(DEFAULT_TIMEZONE)
scheduler = BackgroundScheduler(timezone=tz)

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
    enabled_banks = db.query(BankDB).filter(BankDB.disabled == False).all()
    db.close()
    for bank in enabled_banks:
        # Check latest rate for this bank
        latest_rate = db.query(ExchangeRateDB).filter(ExchangeRateDB.bank == bank.name).order_by(ExchangeRateDB.sync_date.desc()).first()
        if latest_rate and (datetime.now(tz) - latest_rate.sync_date).total_seconds() < 3600:
            logger.info(f"Skipping {bank.name}: latest rate is less than an hour old.")
            continue
        logger.info(f"Syncing rates for {bank.name}...")
        rate_data = scraper.get_bank_rate(bank.name)
        if rate_data:
            buy_rate = rate_data["buy_rate"]
            sell_rate = rate_data["sell_rate"]
            new_rate = ExchangeRateDB(
                bank=bank.name,
                buy_rate=buy_rate,
                sell_rate=sell_rate,
                source=rate_data["source"],
                sync_date=datetime.now(tz)
            )
            db.add(new_rate)
            db.commit()
            logger.info(f"Saved rates for {bank.name}: buy={buy_rate}, sell={sell_rate}")
        else:
            logger.warning(f"No rates found for {bank.name}")
    logger.info(f"Sync job complete. Banks synced: {len(results)}")

def backup_rates_job():
    now = datetime.now(tz)
    backup_filename = f"rates_bk_{now.month:02d}_{now.day:02d}_{now.year}.sql"
    backup_path = os.path.join('/scripts', backup_filename)
    script_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'export_rates_seed.py')
    try:
        result = subprocess.run([
            sys.executable, script_path, '--output', backup_path
        ], capture_output=True, text=True)
        if result.returncode != 0:
            logger.error(f"Backup failed: {result.stderr}")
            return False, result.stderr
        logger.info(f"Backup created: {backup_path}")
        return True, backup_path
    except Exception as e:
        logger.error(f"Backup exception: {e}")
        return False, str(e)

@app.post("/backup")
def trigger_backup():
    success, info = backup_rates_job()
    if success:
        return JSONResponse(content={"status": "success", "file": info})
    else:
        return JSONResponse(content={"status": "error", "error": info}, status_code=500)

@app.post("/sync")
async def sync_rates(background_tasks: BackgroundTasks):
    background_tasks.add_task(sync_rates_job)
    return {"status": "accepted"}

# Schedule sync_rates to run daily at 8:00am
def start_scheduler():
    scheduler.add_job(sync_rates_job, 'cron', hour=8, minute=0, timezone=tz)
    scheduler.add_job(backup_rates_job, 'cron', hour=7, minute=0, timezone=tz)
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

from fastapi_pagination import Page, add_pagination, paginate

@app.get("/rates/all", response_model=Page[ExchangeRate])
def get_all_rates(page: int = 1, size: int = 10, sort_by: str = 'sync_date', order: str = 'desc'):
    logger.info(f"Fetching all rates ordered by {sort_by} {order}...")
    rates = crud.get_all_rates_ordered(sort_by=sort_by, order=order)
    # Convert to ExchangeRate model
    rates_models = [ExchangeRate(
        bank=r.bank,
        buy_rate=r.buy_rate,
        sell_rate=r.sell_rate,
        sync_date=r.sync_date,
        source=r.source if r.source is not None else ""
    ) for r in rates]
    return paginate(rates_models)

add_pagination(app)


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

@app.post("/banks/{bank}/status")
def update_bank_status(bank: str, status: BankStatusUpdate):
    if not validate_bank(bank):
        raise HTTPException(status_code=404, detail="Bank not supported")
    db_bank = crud.update_bank_status(bank_name=bank, disabled=status.disabled)
    if not db_bank:
        raise HTTPException(status_code=404, detail="Bank not found")
    return {"bank": db_bank.name, "disabled": db_bank.disabled}

# New /buy endpoint (GET)
@app.get("/buy")
def buy(dop: float = None, usd: float = None):
    if dop is None and usd is None:
        raise HTTPException(status_code=400, detail="Provide either 'dop' or 'usd' as a query parameter.")
    db = SessionLocal()
    # Get latest rate for each bank
    banks = db.query(ExchangeRateDB.bank).distinct().all()
    latest_rates = []
    for bank_tuple in banks:
        bank = bank_tuple[0]
        rate = db.query(ExchangeRateDB).filter(ExchangeRateDB.bank == bank).order_by(ExchangeRateDB.sync_date.desc()).first()
        if rate:
            latest_rates.append(rate)
    db.close()
    results = []
    buy_rates = [r.buy_rate for r in latest_rates if r.buy_rate]
    avg_buy_rate = sum(buy_rates) / len(buy_rates) if buy_rates else None
    for r in latest_rates:
        if dop is not None:
            usd_calc = dop / r.buy_rate if r.buy_rate else 0
            results.append({"bank": r.bank, "usd": round(usd_calc, 2), "dop": dop, "buy_rate": r.buy_rate})
        elif usd is not None:
            dop_calc = usd * r.buy_rate if r.buy_rate else 0
            results.append({"bank": r.bank, "usd": usd, "dop": round(dop_calc, 2), "buy_rate": r.buy_rate})
    # Sort by USD descending if dop provided, else by DOP descending
    if dop is not None:
        results.sort(key=lambda x: x["usd"], reverse=True)
    elif usd is not None:
        results.sort(key=lambda x: x["dop"], reverse=True)
    average = None
    if avg_buy_rate:
        if dop is not None:
            average = {"avg_buy_rate": round(avg_buy_rate, 4), "usd": round(dop / avg_buy_rate, 2), "dop": dop}
        elif usd is not None:
            average = {"avg_buy_rate": round(avg_buy_rate, 4), "usd": usd, "dop": round(usd * avg_buy_rate, 2)}
    return {"results": results, "average": average}

# New /sell endpoint (GET)
@app.get("/sell")
def sell(dop: float = None, usd: float = None):
    if dop is None and usd is None:
        raise HTTPException(status_code=400, detail="Provide either 'dop' or 'usd' as a query parameter.")
    db = SessionLocal()
    # Get latest rate for each bank
    banks = db.query(ExchangeRateDB.bank).distinct().all()
    latest_rates = []
    for bank_tuple in banks:
        bank = bank_tuple[0]
        rate = db.query(ExchangeRateDB).filter(ExchangeRateDB.bank == bank).order_by(ExchangeRateDB.sync_date.desc()).first()
        if rate:
            latest_rates.append(rate)
    db.close()
    results = []
    sell_rates = [r.sell_rate for r in latest_rates if r.sell_rate]
    avg_sell_rate = sum(sell_rates) / len(sell_rates) if sell_rates else None
    for r in latest_rates:
        if dop is not None:
            usd_calc = dop / r.sell_rate if r.sell_rate else 0
            results.append({"bank": r.bank, "usd": round(usd_calc, 2), "dop": dop, "sell_rate": r.sell_rate})
        elif usd is not None:
            dop_calc = usd * r.sell_rate if r.sell_rate else 0
            results.append({"bank": r.bank, "usd": usd, "dop": round(dop_calc, 2), "sell_rate": r.sell_rate})
    # Sort by USD descending if dop provided, else by DOP descending
    if dop is not None:
        results.sort(key=lambda x: x["usd"], reverse=True)
    elif usd is not None:
        results.sort(key=lambda x: x["dop"], reverse=True)
    average = None
    if avg_sell_rate:
        if dop is not None:
            average = {"avg_sell_rate": round(avg_sell_rate, 4), "usd": round(dop / avg_sell_rate, 2), "dop": dop}
        elif usd is not None:
            average = {"avg_sell_rate": round(avg_sell_rate, 4), "usd": usd, "dop": round(usd * avg_sell_rate, 2)}
    return {"results": results, "average": average}
