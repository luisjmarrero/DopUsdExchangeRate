
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
    Base.metadata.create_all(bind=engine)
    add_source_column()
    add_disabled_column()
    create_banks_table_and_seed()
