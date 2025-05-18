# Development Guide for LinuxOverApi

This guide provides information for developers who want to contribute to or extend the LinuxOverApi project.

## Development Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/LinuxOverApi-MVP.git
   cd LinuxOverApi-MVP
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install development dependencies:
   ```bash
   pip install -r requirements.txt
   pip install pytest pytest-cov black isort flake8 mypy
   ```

4. Set up pre-commit hooks (optional):
   ```bash
   pip install pre-commit
   pre-commit install
   ```

## Code Style and Standards

This project follows these code style guidelines:

1. **PEP 8**: Follow Python PEP 8 style guide
2. **Docstrings**: Use Google-style docstrings for all functions and classes
3. **Type hints**: Use Python type hints where appropriate
4. **Black**: Use Black for automatic code formatting
5. **Isort**: Use isort for sorting imports

You can automatically format code with:
```bash
black .
isort .
```

And check code quality with:
```bash
flake8 .
mypy .
```

## Project Structure and Architecture

The project follows a modular architecture:

1. **API Layer**: Handles HTTP requests/responses (app/api/)
2. **Core Layer**: Contains business logic (app/core/)
3. **Models Layer**: Defines request/response schemas (app/models/)
4. **Database Layer**: Manages database models and operations (app/database.py)
5. **Utilities**: Helper functions and validation (app/utils/)

## Adding a New Scanning Tool

To add a new scanning tool to the system:

1. Add the tool definition in `app/core/scanner.py`:
   ```python
   # Add to SCANNER_TOOLS dictionary
   "newtool": ScannerTool(
       name="newtool",
       command_template="newtool {domain}",
       description="Description of what the tool does"
   )
   ```

2. Create a dedicated endpoint in `app/api/scans.py`:
   ```python
   @router.post("/scan/newtool", response_model=ScanResponse)
   async def newtool_scan(
       scan_request: ScanRequest,
       db: Session = Depends(get_db)
   ):
       """
       Execute a scan using newtool.
       """
       return execute_scan("newtool", scan_request.domain, scan_request.api_key, db)
   ```

3. Ensure the tool is installed in the Docker container by adding it to the Dockerfile:
   ```dockerfile
   RUN apt-get update && apt-get install -y --no-install-recommends \
       newtool \
       && rm -rf /var/lib/apt/lists/*
   ```

## Extending the User Model

To add new fields to the User model:

1. Update the database model in `app/database.py`:
   ```python
   class User(Base):
       # Existing fields...
       new_field = Column(String)
   ```

2. Update the Pydantic models in `app/models/user.py`:
   ```python
   class UserCreate(UserBase):
       # Existing fields...
       new_field: str

   class UserResponse(UserBase):
       # Existing fields...
       new_field: str
   ```

3. Update the user registration logic in `app/api/auth.py`:
   ```python
   new_user = User(
       # Existing fields...
       new_field=user_data.new_field
   )
   ```

## Adding Authentication to a Route

To require authentication for a new route:

```python
from app.core.security import get_current_user

@router.get("/protected-route")
async def protected_route(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    This route requires authentication.
    """
    return {"message": f"Hello, {current_user.username}"}
```

## Database Migrations

The current version uses SQLAlchemy's `create_all` approach for simplicity, but for a production system, you should use Alembic for database migrations:

1. Install Alembic:
   ```bash
   pip install alembic
   ```

2. Initialize Alembic:
   ```bash
   alembic init migrations
   ```

3. Configure Alembic to use your database:
   - Edit `alembic.ini` to set the database URL
   - Edit `migrations/env.py` to import your models

4. Create a migration:
   ```bash
   alembic revision --autogenerate -m "Description of changes"
   ```

5. Apply migrations:
   ```bash
   alembic upgrade head
   ```

## Testing

### Writing Tests

The project uses pytest for testing. Tests should be placed in the `tests/` directory:

1. **Unit Tests**: Test individual functions in isolation
2. **Integration Tests**: Test the API endpoints with a test database
3. **Functional Tests**: Test the entire application workflow

Example test:

```python
# tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_user():
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "testuser",
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "password": "SecurePass123",
            "mobile_no": "1234567890"
        }
    )
    assert response.status_code == 201
    assert "username" in response.json()
    assert response.json()["username"] == "testuser"
```

### Running Tests

Run tests with pytest:
```bash
pytest
```

Generate a coverage report:
```bash
pytest --cov=app tests/
```

## Debugging

For debugging the application:

1. Add debug logging:
   ```python
   import logging
   logging.basicConfig(level=logging.DEBUG)
   logger = logging.getLogger(__name__)
   
   logger.debug("Debug message with variable: %s", variable)
   ```

2. Use FastAPI's built-in debug mode:
   ```bash
   uvicorn app.main:app --reload --log-level=debug
   ```

3. Use Python's debugger:
   ```python
   import pdb; pdb.set_trace()
   ```

## Performance Optimization

If you need to optimize the application:

1. Add database indexing for frequently queried fields
2. Implement caching for expensive operations
3. Use asynchronous processing for long-running scans
4. Consider implementing connection pooling for the database
5. Add pagination for endpoints that return large amounts of data

## Security Best Practices

When developing features, follow these security best practices:

1. Always validate and sanitize user input
2. Use parameterized queries to prevent SQL injection
3. Never expose sensitive data in logs or error messages
4. Implement proper rate limiting for APIs
5. Use the principle of least privilege for database access
6. Regularly update dependencies to patch security vulnerabilities
7. Store credentials securely using environment variables
8. Implement proper error handling