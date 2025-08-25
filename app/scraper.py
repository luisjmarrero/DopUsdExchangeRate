
import requests
from bs4 import BeautifulSoup
import logging
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

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
				buy_rate = max(sell_rates)  # Use highest venta rate as buy_rate
				sell_rate = min(buy_rates)  # Use lowest compra rate as sell_rate
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
					buy_rate = max(sell_rates)  # Use highest venta rate as buy_rate
					sell_rate = min(buy_rates)  # Use lowest compra rate as sell_rate
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
				min_buy = max(sell_rates)  # Use highest venta rate as buy_rate
				max_sell = min(buy_rates)  # Use lowest compra rate as sell_rate
				logger.info(f"BHD rates found: buy={min_buy}, sell={max_sell}")
				return min_buy, max_sell
			logger.warning("Dólares US$ row not found in BHD modal table.")
			return None, None

		try:
			chrome_options = Options()
			chrome_options.add_argument('--headless')
			chrome_options.add_argument('--no-sandbox')
			chrome_options.add_argument('--disable-dev-shm-usage')
			chrome_options.add_argument('--disable-blink-features=AutomationControlled')
			chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
			driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

			# Try the main page first
			url = "https://bhd.com.do/"
			logger.info(f"Trying BHD main page: {url}")
			driver.get(url)
			import time
			time.sleep(3)
			close_overlays(driver)

			# Look for rates directly on the main page first
			page_text = driver.find_element(By.TAG_NAME, "body").text
			import re
			rate_pattern = r'(\d{1,3}(?:[.,]\d{1,4})?)'
			matches = re.findall(rate_pattern, page_text)
			potential_rates = [float(match.replace(',', '.')) for match in matches if 50 <= float(match.replace(',', '.')) <= 100]

			if len(potential_rates) >= 2:
				# For BHD, we need to be more careful about which rate is buy vs sell
				# Look for patterns where rates appear together
				page_text = driver.find_element(By.TAG_NAME, "body").text
				import re

				# Look for USD rates that appear together
				usd_patterns = [
					r'USD[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)',
					r'dólar[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)',
					r'compra[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)[^\d]*venta[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)',
					r'venta[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)[^\d]*compra[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)',
				]

				for pattern in usd_patterns:
					matches = re.findall(pattern, page_text, re.IGNORECASE)
					if matches:
						for match in matches:
							rate1 = float(match[0].replace(',', '.'))
							rate2 = float(match[1].replace(',', '.'))
							if 50 <= rate1 <= 100 and 50 <= rate2 <= 100:
								# Assume the first rate is sell (venta) and second is buy (compra)
								sell_rate = min(rate1, rate2)
								buy_rate = max(rate1, rate2)
								logger.info(f"BHD rates found on main page (pattern): buy={buy_rate}, sell={sell_rate}")
								driver.quit()
								return {"buy_rate": buy_rate, "sell_rate": sell_rate, "source": url}

				# If no pattern matches, use the proximity approach
				sorted_rates = sorted(potential_rates)
				for i in range(len(sorted_rates) - 1):
					rate1 = sorted_rates[i]
					rate2 = sorted_rates[i + 1]
					if abs(rate1 - rate2) < 5:  # Rates are close to each other
						sell_rate = min(rate1, rate2)
						buy_rate = max(rate1, rate2)
						logger.info(f"BHD rates found on main page (proximity): buy={buy_rate}, sell={sell_rate}")
						driver.quit()
						return {"buy_rate": buy_rate, "sell_rate": sell_rate, "source": url}

				# Final fallback - but with correct logic
				buy_rate = max(potential_rates)
				sell_rate = min(potential_rates)
				logger.info(f"BHD rates found on main page (fallback): buy={buy_rate}, sell={sell_rate}")
				driver.quit()
				return {"buy_rate": buy_rate, "sell_rate": sell_rate, "source": url}

			# If not found on main page, try to find and click the button
			tasas_button = find_tasas_button(driver)
			if tasas_button:
				try:
					# Scroll and wait for element to be clickable
					driver.execute_script("arguments[0].scrollIntoView(true);", tasas_button)
					time.sleep(1)

					# Try multiple click methods
					click_success = False
					try:
						# Method 1: Normal click
						tasas_button.click()
						logger.info("Clicked 'Tasas de Cambio' button (normal click).")
						click_success = True
					except Exception as click_error:
						logger.warning(f"Normal click failed: {click_error}")
						try:
							# Method 2: JavaScript click
							driver.execute_script("arguments[0].click();", tasas_button)
							logger.info("Clicked 'Tasas de Cambio' button (JS click).")
							click_success = True
						except Exception as js_error:
							logger.warning(f"JS click also failed: {js_error}")

					if click_success:
						time.sleep(3)  # Wait for popup to load

						# Try to find the popup
						try:
							popup = driver.find_element(By.TAG_NAME, "app-cambio_rate_popup")
							logger.info("Found <app-cambio_rate_popup> element.")
							buy_rate, sell_rate = extract_rates(popup)
							if buy_rate and sell_rate:
								driver.quit()
								return {"buy_rate": buy_rate, "sell_rate": sell_rate, "source": url}
						except Exception as popup_error:
							logger.warning(f"Could not find popup: {popup_error}")

				except Exception as e:
					logger.error(f"Error with button clicking: {e}")
			else:
				logger.warning("Could not find 'Tasas de Cambio' button.")

			# If all else fails, try a direct rates page
			try:
				rates_url = "https://bhd.com.do/personas/tasas-de-cambio"
				logger.info(f"Trying direct rates page: {rates_url}")
				driver.get(rates_url)
				time.sleep(3)

				page_text = driver.find_element(By.TAG_NAME, "body").text
				rate_pattern = r'(\d{1,3}(?:[.,]\d{1,4})?)'
				matches = re.findall(rate_pattern, page_text)
				potential_rates = [float(match.replace(',', '.')) for match in matches if 50 <= float(match.replace(',', '.')) <= 100]

				if len(potential_rates) >= 2:
					buy_rate = max(potential_rates)
					sell_rate = min(potential_rates)
					logger.info(f"BHD rates found on direct page: buy={buy_rate}, sell={sell_rate}")
					driver.quit()
					return {"buy_rate": buy_rate, "sell_rate": sell_rate, "source": rates_url}
			except Exception as direct_error:
				logger.warning(f"Direct rates page also failed: {direct_error}")

			logger.error("All BHD scraping methods failed.")
			driver.quit()
			driver.quit()
		except Exception as e:
			logger.error(f"Error scraping BHD rates: {e}")
	if bank == "Banco Lopez de Haro":
		logger.info("Scraping Banco Lopez de Haro exchange rates...")
		url = "https://www.blh.com.do/"

		# Use Selenium as primary method due to website security measures
		logger.info("Using Selenium for Banco Lopez de Haro (primary method)...")
		chrome_options = Options()
		chrome_options.add_argument('--headless')
		chrome_options.add_argument('--no-sandbox')
		chrome_options.add_argument('--disable-dev-shm-usage')
		chrome_options.add_argument('--disable-gpu')
		chrome_options.add_argument('--window-size=1920,1080')
		chrome_options.add_argument('--disable-blink-features=AutomationControlled')
		chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
		chrome_options.add_argument('--disable-extensions')
		chrome_options.add_argument('--disable-plugins')
		chrome_options.add_argument('--disable-images')  # Speed up loading

		driver = None
		try:
			service = Service(ChromeDriverManager().install())
			# Note: service.add_argument is not available, using options instead
			# chrome_options.add_argument('--log-level=3')  # Reduce selenium logging - removed due to type error
			driver = webdriver.Chrome(service=service, options=chrome_options)

			# Set page load timeout
			driver.set_page_load_timeout(30)
			driver.get(url)

			# Wait for page to load
			import time
			time.sleep(5)

			# Try to find the rates section
			rate_selectors = [
				"//div[contains(text(), 'Tasa') or contains(text(), 'tasas') or contains(text(), 'referencia')]",
				"//table[contains(., 'USD') or contains(., 'Dólar') or contains(., 'dolar')]",
				"//div[contains(@class, 'rate') or contains(@class, 'tasa') or contains(@class, 'exchange')]",
				"//section[contains(., 'USD') or contains(., 'Dólar')]",
				"//*[contains(text(), 'compra') or contains(text(), 'venta')]"
			]

			rates_found = False
			for selector in rate_selectors:
				try:
					elements = driver.find_elements(By.XPATH, selector)
					if elements:
						for element in elements:
							text = element.text.lower()
							if ('usd' in text or 'dólar' in text or 'dolar' in text) and ('compra' in text or 'venta' in text or 'tasa' in text):
								logger.info(f"Found potential rates section: {text[:200]}...")
								rates_found = True
								break
						if rates_found:
							break
				except Exception:
					continue

			if rates_found:
				# Extract all text from the page and look for rates
				page_text = driver.find_element(By.TAG_NAME, "body").text

				# Look for patterns like "Compra: 58.50" or "Venta: 59.20"
				import re
				rate_patterns = [
					r'compra[:\s]+(\d{1,3}(?:[.,]\d{1,4})?)',
					r'venta[:\s]+(\d{1,3}(?:[.,]\d{1,4})?)',
					r'compra\s+usd[:\s]+(\d{1,3}(?:[.,]\d{1,4})?)',
					r'venta\s+usd[:\s]+(\d{1,3}(?:[.,]\d{1,4})?)',
					r'(\d{1,3}(?:[.,]\d{1,4})?)\s*(?:compra|venta)',
				]

				buy_rates = []
				sell_rates = []

				for pattern in rate_patterns:
					matches = re.findall(pattern, page_text, re.IGNORECASE)
					for match in matches:
						rate = float(match.replace(',', '.'))
						if 50 <= rate <= 100:  # Reasonable rate range for DOP/USD
							if 'compra' in pattern or 'buy' in pattern:
								buy_rates.append(rate)
							else:
								sell_rates.append(rate)

				# If we couldn't distinguish buy/sell, use all rates found
				if not buy_rates and not sell_rates:
					all_rates = re.findall(r'(\d{1,3}(?:[.,]\d{1,4})?)', page_text)
					potential_rates = [float(match.replace(',', '.')) for match in all_rates if 50 <= float(match.replace(',', '.')) <= 100]
					if len(potential_rates) >= 2:
						buy_rates = [min(potential_rates)]
						sell_rates = [max(potential_rates)]

				if buy_rates and sell_rates:
					buy_rate = max(sell_rates)  # Use highest venta rate as buy_rate
					sell_rate = min(buy_rates)  # Use lowest compra rate as sell_rate
					logger.info(f"Banco Lopez de Haro rates found: buy={buy_rate}, sell={sell_rate}")
					return {"buy_rate": buy_rate, "sell_rate": sell_rate, "source": url}
				else:
					logger.warning("Could not extract specific buy/sell rates from Banco Lopez de Haro website.")

			# If no specific section found, try to extract USD rates more precisely
			page_text = driver.find_element(By.TAG_NAME, "body").text
			import re

			# Look for patterns where USD rates appear together
			usd_patterns = [
				r'USD[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)',
				r'dólar[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)',
				r'DÓLAR[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)',
				r'compra[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)[^\d]*venta[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)',
				r'venta[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)[^\d]*compra[^\d]*(\d{1,3}(?:[.,]\d{1,4})?)',
			]

			for pattern in usd_patterns:
				matches = re.findall(pattern, page_text, re.IGNORECASE)
				if matches:
					for match in matches:
						rate1 = float(match[0].replace(',', '.'))
						rate2 = float(match[1].replace(',', '.'))
						if 50 <= rate1 <= 100 and 50 <= rate2 <= 100:
							# Assume the first rate is sell (venta) and second is buy (compra)
							# This is typically the order in Dominican Republic
							sell_rate = min(rate1, rate2)
							buy_rate = max(rate1, rate2)
							logger.info(f"Banco Lopez de Haro rates found (pattern match): buy={buy_rate}, sell={sell_rate}")
							return {"buy_rate": buy_rate, "sell_rate": sell_rate, "source": url}

			# Fallback: look for rates that appear close together in text
			rate_pattern = r'(\\d{1,3}(?:[.,]\\d{1,4})?)'
			matches = re.findall(rate_pattern, page_text)
			potential_rates = [float(match.replace(',', '.')) for match in matches if 50 <= float(match.replace(',', '.')) <= 100]

			# Look for pairs of rates that are close to each other (difference < 5)
			if len(potential_rates) >= 2:
				sorted_rates = sorted(potential_rates)
				for i in range(len(sorted_rates) - 1):
					rate1 = sorted_rates[i]
					rate2 = sorted_rates[i + 1]
					if abs(rate1 - rate2) < 5:  # Rates are close to each other
						sell_rate = min(rate1, rate2)
						buy_rate = max(rate1, rate2)
						logger.info(f"Banco Lopez de Haro rates found (close rates): buy={buy_rate}, sell={sell_rate}")
						return {"buy_rate": buy_rate, "sell_rate": sell_rate, "source": url}

			# Final fallback - use min/max but log warning
			if len(potential_rates) >= 2:
				buy_rate = max(potential_rates)
				sell_rate = min(potential_rates)
				logger.warning(f"Banco Lopez de Haro rates found (fallback): buy={buy_rate}, sell={sell_rate}")
				return {"buy_rate": buy_rate, "sell_rate": sell_rate, "source": url}
			else:
				logger.warning("No suitable exchange rates found on Banco Lopez de Haro website.")

			if driver:
				try:
					driver.quit()
				except:
					pass

		except Exception as selenium_error:
			logger.error(f"Selenium scraping failed for Banco Lopez de Haro: {selenium_error}")
			if driver:
				try:
					driver.quit()
				except:
					pass

		# Final fallback: try requests with different approach
		try:
			logger.info("Trying requests fallback for Banco Lopez de Haro...")
			import urllib3
			urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

			headers = {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.5",
				"Accept-Encoding": "gzip, deflate",
				"Connection": "keep-alive",
				"Upgrade-Insecure-Requests": "1",
			}

			session = requests.Session()
			session.headers.update(headers)

			response = session.get(url, timeout=15, verify=False)
			response.raise_for_status()

			soup = BeautifulSoup(response.text, "html.parser")
			page_text = soup.get_text()

			# Look for any rates in the text
			import re
			rate_pattern = r'(\d{1,3}(?:[.,]\d{1,4})?)'
			matches = re.findall(rate_pattern, page_text)
			potential_rates = [float(match.replace(',', '.')) for match in matches if 50 <= float(match.replace(',', '.')) <= 100]

			if len(potential_rates) >= 2:
				buy_rate = max(potential_rates)  # Use highest rate for buying USD
				sell_rate = min(potential_rates)  # Use lowest rate for selling USD
				logger.info(f"Banco Lopez de Haro rates found (requests fallback): buy={buy_rate}, sell={sell_rate}")
				return {"buy_rate": buy_rate, "sell_rate": sell_rate, "source": url}

		except Exception as requests_error:
			logger.error(f"Requests fallback also failed for Banco Lopez de Haro: {requests_error}")

		logger.error("All scraping methods failed for Banco Lopez de Haro")
		return None

