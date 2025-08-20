import os
import sys
from datetime import datetime, date
from sqlalchemy import func
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database import SessionLocal
from app.models_db import ExchangeRateDB


def export_latest_rates(output_file=None):
    if output_file is None:
        output_file = os.path.join(os.path.dirname(__file__), 'exchange_rates_seed.sql')
    db = SessionLocal()
    # Get all unique (bank, date) pairs
    subq = (
        db.query(
            ExchangeRateDB.bank,
            func.date(ExchangeRateDB.sync_date).label('sync_day'),
            func.max(ExchangeRateDB.sync_date).label('max_sync_date')
        )
        .group_by(ExchangeRateDB.bank, func.date(ExchangeRateDB.sync_date))
        .subquery()
    )
    # Join to get the full latest record for each (bank, day)
    latest_rates = (
        db.query(ExchangeRateDB)
        .join(subq, (ExchangeRateDB.bank == subq.c.bank) & (func.date(ExchangeRateDB.sync_date) == subq.c.sync_day) & (ExchangeRateDB.sync_date == subq.c.max_sync_date))
        .order_by(ExchangeRateDB.bank, ExchangeRateDB.sync_date)
        .all()
    )
    db.close()

    with open(output_file, 'w', encoding='utf-8') as f:
        for rate in latest_rates:
            bank_escaped = rate.bank.replace("'", "''")
            source_escaped = (rate.source or '').replace("'", "''")
            sync_date_str = rate.sync_date.strftime('%Y-%m-%d %H:%M:%S%z')
            insert_sql = (
                f"INSERT INTO exchange_rates (id, bank, buy_rate, sell_rate, sync_date, source) VALUES (\n"
                f"    {rate.id}, '{bank_escaped}', {rate.buy_rate}, {rate.sell_rate}, '{sync_date_str}', '{source_escaped}');\n"
            )
            f.write(insert_sql)
    print(f"Exported {len(latest_rates)} rates to {output_file}")

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Export latest exchange rates to a SQL file.')
    parser.add_argument('--output', '-o', type=str, help='Output SQL file path', default=None)
    args = parser.parse_args()
    export_latest_rates(args.output)
