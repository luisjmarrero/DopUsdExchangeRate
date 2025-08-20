import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.crud import get_all_rates_ordered

client = TestClient(app)

def test_get_all_rates_ordered():
    response = client.get("/rates/all")
    assert response.status_code == 200
    rates = response.json()
    # Check ordering: sync_date descending, then bank ascending
    if rates:
        sync_dates = [r['sync_date'] for r in rates]
        banks = [r['bank'] for r in rates]
        # sync_dates should be descending
        assert sync_dates == sorted(sync_dates, reverse=True)
        # For rates with same sync_date, banks should be ascending
        from collections import defaultdict
        grouped = defaultdict(list)
        for r in rates:
            grouped[r['sync_date']].append(r['bank'])
        for bank_list in grouped.values():
            assert bank_list == sorted(bank_list)
