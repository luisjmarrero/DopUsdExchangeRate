# Agent Instructions for DopUsdExchangeRate

## Build/Lint/Test Commands

### Backend (FastAPI/Python)
- **Run tests**: `python -m pytest`
- **Run specific test**: `python -m pytest tests/test_file.py::test_function -v`
- **Run with coverage**: `python -m pytest --cov=app`
- **Start server**: `uvicorn app.main:app --reload`
- **Run migrations**: `python -m app.migrations`

### Frontend (React/JavaScript)
- **Install dependencies**: `cd frontend && npm install`
- **Start dev server**: `cd frontend && npm start`
- **Build**: `cd frontend && npm run build`
- **Run tests**: `cd frontend && npm test`
- **Run specific test**: `cd frontend && npm test -- --testNamePattern="test name" --watchAll=false`

### Full Stack
- **Docker build**: `docker-compose up --build`
- **Run all tests**: `python -m pytest && cd frontend && npm test -- --watchAll=false`

## Code Style Guidelines

### Python (Backend)
- **Imports**: Standard library → Third-party → Local imports, one per line
- **Type hints**: Use for function parameters and return types
- **Naming**: snake_case for variables/functions, PascalCase for classes
- **Error handling**: Use try/except blocks, raise HTTPException for API errors
- **Database**: Always use context managers for database sessions
- **Logging**: Use `logger.info()`, `logger.warning()`, `logger.error()` for appropriate levels
- **Constants**: Define in `app/constants.py`, use UPPER_SNAKE_CASE
- **Models**: Use Pydantic for API schemas, SQLAlchemy for database models

### JavaScript/React (Frontend)
- **Components**: Use functional components with hooks
- **Naming**: camelCase for variables/functions, PascalCase for components
- **State**: Use useState/useEffect hooks appropriately
- **Styling**: Use CSS modules or styled-components (follow existing patterns)
- **Error handling**: Use try/catch for async operations

### General
- **Comments**: Add docstrings for functions, avoid inline comments unless complex logic
- **Security**: Never log sensitive data (API keys, passwords, etc.)
- **Testing**: Write unit tests for business logic, integration tests for API endpoints
- **Commits**: Use descriptive commit messages following conventional format

## Project Structure
- `app/`: FastAPI backend code
- `frontend/src/`: React frontend code
- `tests/`: Python test files
- `scripts/`: Database seeding and export scripts
- `alembic/`: Database migrations

## Dependencies
- **Backend**: Check `requirements.txt` for Python packages
- **Frontend**: Check `frontend/package.json` for npm packages
- Always verify dependencies exist before using new libraries

## Database
- Uses PostgreSQL with SQLAlchemy ORM
- Always close database sessions after use
- Use migrations for schema changes (via Alembic)
- Follow existing patterns for CRUD operations