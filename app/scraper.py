
import requests
from bs4 import BeautifulSoup
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_bank_rate(bank: str):
	if bank == "Banreservas":
		logger.info("Scraping Banreservas exchange rates...")
		try:
			url = "https://www.banreservas.com/"
			headers = {"User-Agent": "Mozilla/5.0"}
			response = requests.get(url, headers=headers, timeout=10)
			response.raise_for_status()
			soup = BeautifulSoup(response.text, "html.parser")
			compra_els = soup.find_all(class_="tasacambio-compraUS")
			venta_els = soup.find_all(class_="tasacambio-ventaUS")
			buy_rates = []
			sell_rates = []
			import re
			for el in compra_els:
				buy_match = re.search(r"([\d.,]+)", el.get_text(strip=True))
				if buy_match:
					buy_rates.append(float(buy_match.group(1).replace(",", ".")))
			for el in venta_els:
				sell_match = re.search(r"([\d.,]+)", el.get_text(strip=True))
				if sell_match:
					sell_rates.append(float(sell_match.group(1).replace(",", ".")))
			if buy_rates and sell_rates:
				buy_rate = min(sell_rates)  # Use venta (sell) rate for buying USD
				sell_rate = max(buy_rates)  # Use compra (buy) rate for selling USD
				logger.info(f"Banreservas rates found: buy={buy_rate}, sell={sell_rate}")
				return {"buy_rate": buy_rate, "sell_rate": sell_rate, "source": url}
			else:
				logger.warning("Could not find Banreservas rate elements with expected classes.")
		except Exception as e:
			logger.error(f"Error scraping Banreservas rates: {e}")
	if bank == "Scotiabank":
		logger.info("Scraping Scotiabank exchange rates...")
		url = "https://do.scotiabank.com/banca-personal/tarifas/tasas-de-cambio.html"
		try:
			response = requests.get(url, timeout=10)
			response.raise_for_status()
			soup = BeautifulSoup(response.text, "html.parser")
			# Find the table with USD rates
			table = soup.find("table")
			buy_rates = []
			sell_rates = []
			if table:
				rows = table.find_all("tr")
				for row in rows:
					cols = row.find_all("td")
					if len(cols) >= 4 and "Estados Unidos" in cols[0].text:
						buy_val = float(cols[2].text.replace(",", ".").strip())
						sell_val = float(cols[3].text.replace(",", ".").strip())
						buy_rates.append(buy_val)
						sell_rates.append(sell_val)
				if buy_rates and sell_rates:
					buy_rate = min(sell_rates)  # Use venta (sell) rate for buying USD
					sell_rate = max(buy_rates)  # Use compra (buy) rate for selling USD
					logger.info(f"Scotiabank rates found: buy={buy_rate}, sell={sell_rate}")
					return {"buy_rate": buy_rate, "sell_rate": sell_rate, "source": url}
				else:
					logger.warning("USD row not found in Scotiabank table.")
			else:
				logger.warning("Exchange rates table not found for Scotiabank.")
		except Exception as e:
			logger.error(f"Error scraping Scotiabank rates: {e}")
			return None
	if bank == "BHD":
		logger.info("Scraping BHD exchange rates using Selenium...")
		def close_overlays(driver):
			overlays = driver.find_elements(By.XPATH, "//*[contains(@class, 'close') or contains(@class, 'cookie') or contains(@class, 'modal')]")
			for overlay in overlays:
				try:
					overlay.click()
					logger.info("Closed overlay or popup.")
					import time; time.sleep(1)
				except Exception:
					pass

		def find_tasas_button(driver):
			buttons = driver.find_elements(By.TAG_NAME, "button")
			logger.info(f"Found {len(buttons)} buttons on the page.")
			for btn in buttons:
				logger.info(f"Button text: '{btn.text}'")
				if 'tasas de cambio' in btn.text.strip().lower():
					return btn
			return None

		def extract_rates(popup):
			table = popup.find_element(By.CLASS_NAME, "rate_data_tble")
			rows = table.find_elements(By.TAG_NAME, "tr")
			buy_rates = []
			sell_rates = []
			for row in rows:
				cols = row.find_elements(By.TAG_NAME, "td")
				if len(cols) >= 3 and "Dólares US$" in cols[0].text:
					buy_text = cols[1].text.replace(",", ".").replace("DOP", "").strip()
					sell_text = cols[2].text.replace(",", ".").replace("DOP", "").strip()
					try:
						buy_rate = float(buy_text)
						sell_rate = float(sell_text)
						buy_rates.append(buy_rate)
						sell_rates.append(sell_rate)
					except Exception:
						continue
			if buy_rates and sell_rates:
				min_buy = min(sell_rates)  # Use venta (sell) rate for buying USD
				max_sell = max(buy_rates)  # Use compra (buy) rate for selling USD
				logger.info(f"BHD rates found: buy={min_buy}, sell={max_sell}")
				return min_buy, max_sell
			logger.warning("Dólares US$ row not found in BHD modal table.")
			return None, None

		try:
			chrome_options = Options()
			chrome_options.add_argument('--headless')
			chrome_options.add_argument('--no-sandbox')
			chrome_options.add_argument('--disable-dev-shm-usage')
			driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
			url = "https://bhd.com.do/not-found"
			driver.get(url)
			import time
			time.sleep(2)
			close_overlays(driver)
			tasas_button = find_tasas_button(driver)
			if tasas_button:
				try:
					driver.execute_script("arguments[0].scrollIntoView(true);", tasas_button)
					from selenium.webdriver.support.ui import WebDriverWait
					from selenium.webdriver.support import expected_conditions as EC
					WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.XPATH, "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'tasas de cambio')]")))
					try:
						tasas_button.click()
						logger.info("Clicked 'Tasas de Cambio' button (normal click).")
					except Exception as click_error:
						logger.warning(f"Normal click failed, trying JS click: {click_error}")
						driver.execute_script("arguments[0].click();", tasas_button)
						logger.info("Clicked 'Tasas de Cambio' button (JS click).")
					time.sleep(2)
					popup = WebDriverWait(driver, 10).until(
						EC.presence_of_element_located((By.TAG_NAME, "app-cambio_rate_popup"))
					)
					logger.info("Found <app-cambio_rate_popup> element.")
					buy_rate, sell_rate = extract_rates(popup)
					driver.quit()
					if buy_rate and sell_rate:
						return {"buy_rate": buy_rate, "sell_rate": sell_rate, "source": url}
				except Exception as e:
					logger.error(f"Error clicking 'Tasas de Cambio' button or reading rates: {e}")
			else:
				logger.error("Could not find 'Tasas de Cambio' button by any selector.")
			driver.quit()
		except Exception as e:
			logger.error(f"Error scraping BHD rates: {e}")
