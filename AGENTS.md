# AGENTS.md - Development Guidelines for DopUsdExchangeRate

## Build/Lint/Test Commands

### Frontend (React)
```bash
# Development
cd frontend && npm start                    # Start dev server (port 3000)
cd frontend && npm run build               # Production build
cd frontend && npm run build:production    # Optimized production build

# Testing
cd frontend && npm test                    # Run all tests
cd frontend && npm run test:coverage       # Run tests with coverage
cd frontend && npm run test:ci             # CI test mode

# Linting & Formatting
cd frontend && npm run lint                # ESLint check
cd frontend && npm run lint:fix            # ESLint auto-fix
cd frontend && npm run format              # Prettier format
cd frontend && npm run format:check        # Prettier check
```

### Backend (FastAPI/Python)
```bash
# Testing
python -m pytest                          # Run all tests
python -m pytest -v                       # Verbose test output
python -m pytest tests/test_main.py       # Run specific test file
python -m pytest tests/test_main.py::test_function_name  # Run specific test

# Database
python -m app.migrations                  # Run database migrations
alembic upgrade head                      # Alternative migration command

# Development Server
uvicorn app.main:app --reload             # Start dev server (port 8000)
```

### Full Stack (Docker)
```bash
# Full stack deployment
docker-compose up --build                 # Build and start all services
docker-compose up -d                      # Background mode
docker-compose up api                     # API only
docker-compose up db                      # Database only

# Health checks
curl http://localhost:8000/health         # API health check
docker-compose ps                         # Check service status
```

## Code Style Guidelines

### JavaScript/React
- **ESLint Configuration**: Extends `react-app`, `react-app/jest`, `eslint:recommended`
- **Prettier Settings**:
  - Semicolons: enabled
  - Single quotes: enabled
  - Print width: 80 characters
  - Tab width: 2 spaces
  - Trailing commas: ES5 style
  - JSX single quotes: enabled

- **React Patterns**:
  - Use functional components with hooks
  - Prefer arrow functions for component definitions
  - Use proper JSX key props in lists
  - Follow React hooks rules and exhaustive deps
  - Use context providers for global state

- **Import Organization**:
  ```javascript
  import React from 'react';
  import './App.css';

  // Context Providers
  import { ThemeProvider } from './contexts/ThemeContext';

  // Components
  import Header from './components/Header';
  ```

### Python/FastAPI
- **Import Organization**:
  ```python
  # Standard library imports
  from typing import List
  import logging

  # Third-party imports
  from fastapi import FastAPI, HTTPException
  from sqlalchemy.orm import Session

  # Local imports
  from app.models import ExchangeRate
  from app.database import SessionLocal
  ```

- **Error Handling**:
  - Use proper HTTP status codes
  - Return structured error responses
  - Log errors with appropriate levels
  - Use try/catch blocks for database operations

- **Database Patterns**:
  - Use SQLAlchemy ORM for database operations
  - All CRUD operations through `app/crud.py`
  - Use Pydantic schemas for API validation
  - Handle database sessions properly with context managers

- **FastAPI Structure**:
  - API endpoints in `app/main.py`
  - Pydantic models in `app/schemas.py`
  - SQLAlchemy models in `app/models_db.py`
  - Business logic in separate modules

### General Guidelines
- **Naming Conventions**:
  - Use PascalCase for React components
  - Use camelCase for JavaScript variables/functions
  - Use snake_case for Python variables/functions
  - Use UPPER_CASE for constants

- **File Organization**:
  - Co-locate test files with components
  - Group related functionality in modules
  - Use index.js files for clean imports

- **Security**:
  - Never commit secrets or API keys
  - Use environment variables for configuration
  - Validate all user inputs
  - Follow CORS best practices

## Cursor Rules Integration

### Project Structure
- **Backend**: FastAPI + PostgreSQL with scraping, CRUD, and API layers
- **Frontend**: React application with Bootstrap styling and Recharts
- **Key Features**: Bank rate scraping, change tracking, RESTful API

### Development Workflow
- Use Docker for full-stack development
- Run tests before committing changes
- Follow established patterns for new features
- Update API documentation for new endpoints

### Testing Strategy
- Backend: pytest for unit and integration tests
- Frontend: Jest + React Testing Library
- Test both success and failure scenarios
- Mock external dependencies

## API Endpoints Reference
- `POST /sync` - Update rates from banks
- `GET /rates` - Get latest rates for all banks
- `GET /rates/{bank}` - Get rates for specific bank
- `GET /rates/all` - Get all rates with pagination
- `GET /buy?dop=<amount>` - Convert DOP to USD
- `GET /sell?usd=<amount>` - Convert USD to DOP
- `GET /banks` - List supported banks
- `POST /banks/{bank}/status` - Enable/disable bank

## Rate Logic
- **Buy Rate**: Bank sells USD to you (bank's "venta" rate)
- **Sell Rate**: Bank buys USD from you (bank's "compra" rate)
- Rate changes calculated and stored on each sync
- Changes tracked in `sell_change` and `buy_change` fields