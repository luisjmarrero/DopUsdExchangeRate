import pytest
from unittest.mock import patch, MagicMock
from app.scraper import get_bank_rate

BANRESERVAS_HTML = '''
<div class="tasacambio-compraUS">56.50</div>
<div class="tasacambio-ventaUS">57.20</div>
'''
SCOTIABANK_HTML = '''
<table>
<tr><td>Estados Unidos</td><td></td><td>56,60</td><td>57,40</td></tr>
</table>
'''

def mock_response(text, status_code=200):
    mock = MagicMock()
    mock.text = text
    mock.status_code = status_code
    mock.raise_for_status = MagicMock()
    return mock

@patch('app.scraper.requests.get')
def test_get_bank_rate_banreservas(mock_get):
    mock_get.return_value = mock_response(BANRESERVAS_HTML)
    result = get_bank_rate('Banreservas')
    assert result['buy_rate'] == 57.20
    assert result['sell_rate'] == 56.50
    assert 'source' in result

@patch('app.scraper.requests.get')
def test_get_bank_rate_scotiabank(mock_get):
    mock_get.return_value = mock_response(SCOTIABANK_HTML)
    result = get_bank_rate('Scotiabank')
    assert result['buy_rate'] == 57.40
    assert result['sell_rate'] == 56.60
    assert 'source' in result

@patch('app.scraper.webdriver.Chrome')
def test_get_bank_rate_bhd(mock_chrome):
    # Setup mock driver and popup
    mock_driver = MagicMock()
    mock_chrome.return_value = mock_driver
    mock_driver.get.return_value = None
    mock_driver.quit.return_value = None
    mock_driver.find_elements.return_value = []
    # Mock tasas button
    mock_tasas_button = MagicMock()
    mock_tasas_button.text = 'Tasas de Cambio'
    # Patch find_tasas_button to return our button
    mock_driver.find_elements.side_effect = lambda by, value=None: [mock_tasas_button] if by == 'tag name' else []
    # Mock WebDriverWait and popup
    mock_popup = MagicMock()
    mock_table = MagicMock()
    mock_row = MagicMock()
    mock_col1 = MagicMock(); mock_col1.text = 'Dólares US$'
    mock_col2 = MagicMock(); mock_col2.text = '58.00'
    mock_col3 = MagicMock(); mock_col3.text = '59.00'
    mock_row.find_elements.return_value = [mock_col1, mock_col2, mock_col3]
    mock_table.find_elements.return_value = [mock_row]
    mock_popup.find_element.return_value = mock_table
    # Patch WebDriverWait to return popup
    import sys
    sys.modules['selenium.webdriver.support.ui'] = MagicMock()
    sys.modules['selenium.webdriver.support'] = MagicMock()
    from selenium.webdriver.support.ui import WebDriverWait
    WebDriverWait.return_value.until.return_value = mock_popup
    # Patch extract_rates to use our popup
    with patch('app.scraper.Options'), patch('app.scraper.Service'), patch('app.scraper.ChromeDriverManager'):
        result = get_bank_rate('BHD')
    assert result['buy_rate'] == 59.00
    assert result['sell_rate'] == 58.00
    assert 'source' in result
