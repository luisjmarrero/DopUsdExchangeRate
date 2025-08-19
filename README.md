# DopUsdExchangeRate API

A FastAPI-based service to fetch and calculate USD/DOP exchange rates from major Dominican banks.

## Supported Banks
- Banreservas (Pending)
- Banco Popular (Pending)
- BHD
- APAP (Pending)
- Scotiabank

## Features
- Scrapes latest USD/DOP rates from supported banks
- Stores rates in PostgreSQL
- Endpoints for syncing, querying, and calculating rates
- Dockerized for easy deployment

## Endpoints
- `POST /sync` : Queue a sync to update rates from banks
- `GET /rates` : Get all latest rates, ordered by cheapest buy rate
- `GET /rates/{bank}` : Get latest rates for a specific bank
- `GET /banks` : List supported banks
- `POST /calculate/buy/{dop_ammount}` : Calculate USD for given DOP amount
- `POST /calculate/sell/{usd_ammount}` : Calculate DOP for given USD amount

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

## Project Structure
- `app/` : FastAPI app code
- `tests/` : Test cases
- `Dockerfile` : API container
- `docker-compose.yml` : Compose file for API + Postgres
- `.env` : Environment variables

## License
MIT
