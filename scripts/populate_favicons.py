#!/usr/bin/env python3
"""
Script to populate bank favicons in the database.
This script fetches favicons for all banks and stores them in the database.
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal
from app.models_db import BankDB
from app.favicon_service import favicon_service

def populate_favicons():
    """Populate favicons for all banks in the database"""
    db = SessionLocal()
    try:
        # Get all banks from database
        banks = db.query(BankDB).all()

        if not banks:
            print("No banks found in database")
            return

        print(f"Found {len(banks)} banks in database")
        print("Populating favicons...")

        results = {}
        for bank in banks:
            print(f"Processing {bank.name}...")
            success = favicon_service.update_bank_favicon(bank.name)
            results[bank.name] = success

            if success:
                print(f"✓ Successfully updated favicon for {bank.name}")
            else:
                print(f"✗ Failed to update favicon for {bank.name}")

        # Print summary
        successful = sum(1 for success in results.values() if success)
        total = len(results)

        print("\nSummary:")
        print(f"Successfully updated: {successful}/{total} banks")

        if successful < total:
            print("\nFailed banks:")
            for bank_name, success in results.items():
                if not success:
                    print(f"  - {bank_name}")

    except Exception as e:
        print(f"Error populating favicons: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    populate_favicons()