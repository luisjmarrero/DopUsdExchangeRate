import pytest
from unittest.mock import patch, MagicMock
from app.crud import create_rate

@patch('app.crud.SessionLocal')
@patch('app.crud.ExchangeRateDB')
def test_create_rate(mock_ExchangeRateDB, mock_SessionLocal):
    mock_db = MagicMock()
    mock_SessionLocal.return_value = mock_db
    mock_rate = MagicMock()
    mock_ExchangeRateDB.return_value = mock_rate

    result = create_rate('TestBank', 50.0, 52.0)

    mock_db.add.assert_called_once_with(mock_rate)
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once_with(mock_rate)
    mock_db.close.assert_called_once()
    assert result == mock_rate
