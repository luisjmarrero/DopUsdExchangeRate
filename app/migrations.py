
from app.constants import SUPPORTED_BANKS
from app.models_db import BankDB
from app.database import engine, Base
from sqlalchemy import text

def add_source_column():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='exchange_rates' AND column_name='source'"))
        if not result.fetchone():
            conn.execute(text("ALTER TABLE exchange_rates ADD COLUMN source VARCHAR"))
            print("Added 'source' column to exchange_rates table.")
        else:
            print("'source' column already exists.")

def add_disabled_column():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='exchange_rates' AND column_name='disabled'"))
        if not result.fetchone():
            conn.execute(text("ALTER TABLE exchange_rates ADD COLUMN disabled BOOLEAN DEFAULT FALSE"))
            print("Added 'disabled' column to exchange_rates table.")
        else:
            print("'disabled' column already exists.")

def add_change_columns():
    with engine.connect() as conn:
        result_sell = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='exchange_rates' AND column_name='sell_change'"))
        if not result_sell.fetchone():
            conn.execute(text("ALTER TABLE exchange_rates ADD COLUMN sell_change FLOAT"))
            print("Added 'sell_change' column to exchange_rates table.")
        else:
            print("'sell_change' column already exists.")
        result_buy = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='exchange_rates' AND column_name='buy_change'"))
        if not result_buy.fetchone():
            conn.execute(text("ALTER TABLE exchange_rates ADD COLUMN buy_change FLOAT"))
            print("Added 'buy_change' column to exchange_rates table.")
        else:
            print("'buy_change' column already exists.")

def backfill_change_columns():
    with engine.connect() as conn:
        # Use window functions to calculate changes
        conn.execute(text('''
            UPDATE exchange_rates SET
                sell_change = sub.sell_change,
                buy_change = sub.buy_change
            FROM (
                SELECT id,
                    sell_rate - LAG(sell_rate) OVER (PARTITION BY bank ORDER BY sync_date) AS sell_change,
                    buy_rate - LAG(buy_rate) OVER (PARTITION BY bank ORDER BY sync_date) AS buy_change
                FROM exchange_rates
            ) sub
            WHERE exchange_rates.id = sub.id;
        '''))
        conn.commit()  # Commit the transaction
        print("Backfilled sell_change and buy_change columns.")

def create_banks_table_and_seed():
    BankDB.__table__.create(bind=engine, checkfirst=True)
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()
    for bank in SUPPORTED_BANKS:
        exists = session.query(BankDB).filter_by(name=bank).first()
        if not exists:
            session.add(BankDB(name=bank, disabled=False))
    session.commit()
    session.close()

if __name__ == "__main__":
    print("Connecting to:", engine.url)
    Base.metadata.create_all(bind=engine)
    add_source_column()
    add_disabled_column()
    add_change_columns()
    backfill_change_columns()
    create_banks_table_and_seed()