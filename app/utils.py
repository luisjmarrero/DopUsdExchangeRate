from .constants import SUPPORTED_BANKS

def validate_bank(bank: str) -> bool:
    return bank in SUPPORTED_BANKS
