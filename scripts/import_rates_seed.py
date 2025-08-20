import os
import sys
from sqlalchemy import text
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database import engine

SEED_FILE = os.path.join(os.path.dirname(__file__), 'exchange_rates_seed.sql')

def import_seed_data():
    with engine.connect() as conn:
        print('Truncating exchange_rates table...')
        conn.execute(text('TRUNCATE TABLE exchange_rates RESTART IDENTITY CASCADE;'))
        print(f'Loading seed data from {SEED_FILE}...')
        with open(SEED_FILE, 'r', encoding='utf-8') as f:
            sql = f.read()
            if sql.strip():
                conn.execute(text(sql))
        print('Seed data imported.')

if __name__ == '__main__':
    import_seed_data()
