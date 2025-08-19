**! Disclaimer**
> This project is for learning purposes only. It is not intended for commercial use or monetization. Exchange rates and banking data are provided for educational demonstration and may not be accurate or suitable for financial decisions.
# DopUsdExchangeRate API

A FastAPI-based service to fetch and calculate USD/DOP exchange rates from major Dominican banks.

## Supported Banks
- Banreservas
- Banco Popular (Pending)
- BHD
- APAP (Pending)
- Scotiabank

## Features
- Scrapes latest USD/DOP rates from supported banks
- Stores rates in PostgreSQL
- Endpoints for syncing, querying, and calculating rates
- Dockerized for easy deployment

## Buy/Sell Rate Logic
For each bank:
- **Buy Rate**: The rate at which you buy USD from the bank (bank sells USD to you). This is taken from the bank's "venta" (sell) rate.
- **Sell Rate**: The rate at which you sell USD to the bank (bank buys USD from you). This is taken from the bank's "compra" (buy) rate.

Endpoints use:
- `/buy`: Uses the "venta" (sell) rate for each bank to calculate how much USD you get for your DOP.
- `/sell`: Uses the "compra" (buy) rate for each bank to calculate how much DOP you get for your USD.

## Endpoints
 - `POST /sync` : Queue a sync to update rates from banks
 - `GET /rates` : Get all latest rates, ordered by cheapest buy rate
 - `GET /rates/{bank}` : Get latest rates for a specific bank
 - `GET /banks` : List supported banks
 - `GET /buy?dop=<amount>` : Convert DOP to USD for each bank and show calculated average
 - `GET /sell?usd=<amount>` : Convert USD to DOP for each bank and show calculated average

## Development Setup

### 1. Clone the repo
```
git clone <repo-url>
cd DopUsdExchangeRate
```


### 2. Create and activate a virtual environment
```
python3 -m venv venv
source venv/bin/activate
```


### 3. Create your .env file (for local development)
Copy the sample file and edit as needed:
```
cp .env.sample .env
# Edit .env if you need to change database credentials or host
```

### 4. Docker Compose environment
Docker Compose uses `.env.docker` for environment variables. You do not need to create this file unless you want to change the default Docker database settings.

### 4. Install dependencies
```
pip install -r requirements.txt
```

### 5. Run locally (requires PostgreSQL running)
```
uvicorn app.main:app --reload
```

### 5. Run with Docker Compose
```
docker-compose up --build
```

API will be available at `http://localhost:8000`

## Testing with Postman
- Import the provided endpoints into Postman
- Test each endpoint as described above
-
### Example requests


**Convert DOP to USD (using bank's sell rate):**
```bash
curl "http://localhost:8000/buy?dop=500"
```

**Convert USD to DOP (using bank's buy rate):**
```bash
curl "http://localhost:8000/sell?usd=100"
```

## Project Structure
- `app/` : FastAPI app code
- `tests/` : Test cases
- `Dockerfile` : API container
- `docker-compose.yml` : Compose file for API + Postgres
- `.env` : Environment variables

## License
MIT
