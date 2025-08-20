import pytest
from app.utils import validate_bank
from app.constants import SUPPORTED_BANKS

def test_validate_bank_supported():
    for bank in SUPPORTED_BANKS:
        assert validate_bank(bank) is True

def test_validate_bank_unsupported():
    assert validate_bank('NonExistentBank') is False
