# LinuxOverApi

A secure API service for accessing security scanning tools with authentication and usage tracking.

## Features

- User registration and authentication with JWT tokens
- API key management for free and paid tiers
- Multiple security scanning tools integration
- Usage tracking and rate limiting
- Admin capabilities for system management

## Available Scanning Tools

- **dig**: DNS lookup tool that provides information about DNS records
- **nmap**: Network discovery and security auditing tool
- **subfinder**: Subdomain discovery tool
- **wpscan**: WordPress security scanner
- **whatweb**: Web scanner that identifies web technologies
- **sslscan**: SSL/TLS scanner that tests SSL/TLS enabled services
- **nuclei**: Fast and customizable vulnerability scanner

## Getting Started

### Prerequisites

- Python 3.9 or later
- Docker and Docker Compose (optional, for containerized deployment)
- The necessary security tools installed on your system

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/LinuxOverApi-MVP.git
   cd LinuxOverApi-MVP
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Create a `.env` file with the necessary environment variables:
   ```
   DATABASE_URL=sqlite:///./api_data.db
   SECRET_KEY=your-secret-key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=720
   ADMIN_SECRET_KEY=your-admin-secret
   API_FREE_LIMIT=15
   ```

### Running the Application

#### Running locally

```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000.

API documentation will be available at http://localhost:8000/docs.

#### Running with Docker

```bash
docker-compose up --build
```

## API Usage

### 1. User Registration

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
            "username": "testuser",
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "password": "SecurePass123",
            "mobile_no": "1234567890"
        }'
```

### 2. User Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=testuser&password=SecurePass123"
```

The response will contain a JWT token:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3. Generate API Key

```bash
curl -X POST "http://localhost:8000/api/v1/apikeys/generate-api-key" \
     -H "Content-Type: application/json" \
     -d '{
            "username": "testuser",
            "api_type": "free",
            "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }'
```

### 4. View Available Tools

```bash
curl "http://localhost:8000/api/v1/scans/tools"
```

### 5. Run a Scan

```bash
curl -X POST "http://localhost:8000/api/v1/scans/scan/dig" \
     -H "Content-Type: application/json" \
     -d '{
            "domain": "example.com",
            "api_key": "14f3ff2c-97e7-4ec5-8484-59953d5d3b40"
        }'
```

### 6. View Scan History

```bash
curl "http://localhost:8000/api/v1/scans/history/14f3ff2c-97e7-4ec5-8484-59953d5d3b40"
```

## Free vs Paid Tier

### Free Tier

- Maximum of 15 scan executions per API key
- Basic tools access (dig, nmap, whatweb)
- No scheduled scans

### Paid Tier

- Unlimited scan executions
- Access to all tools (including subfinder, wpscan, sslscan, nuclei)
- Request for more customized scans

## Admin API Endpoints

Admin endpoints require the admin secret key:

### 1. View All API Keys

```bash
curl "http://localhost:8000/api/v1/apikeys/fetch-all?admin_secret_key=your-admin-secret"
```

### 2. View All Users

```bash
curl "http://localhost:8000/api/v1/users/fetch-all-users?admin_secret_key=your-admin-secret"
```

## Project Structure

```
LinuxOverApi-MVP/
│
├── app/                     # Main application package
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection and models
│   ├── dependencies.py      # FastAPI dependencies
│   │
│   ├── api/                 # API routes
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication routes
│   │   ├── users.py         # User management routes
│   │   ├── apikeys.py       # API key management routes
│   │   └── scans.py         # Scanning tools routes
│   │
│   ├── models/              # Pydantic models for request/response
│   │   ├── __init__.py
│   │   ├── auth.py          # Auth-related schemas
│   │   ├── user.py          # User-related schemas
│   │   └── scan.py          # Scan-related schemas
│   │
│   ├── core/                # Core business logic
│   │   ├── __init__.py
│   │   ├── security.py      # Security utilities (password hashing, JWT)
│   │   ├── apikey.py        # API key generation and validation
│   │   └── scanner.py       # Scanning tools implementation
│   │
│   └── utils/               # Utility functions
│       ├── __init__.py
│       └── validators.py    # Input validation utilities
│
├── docker/                  # Docker-related files
│   └── Dockerfile
│
├── tests/                   # Test cases
│   ├── __init__.py
│   ├── test_auth.py
│   └── test_scans.py
│
├── .env                     # Environment variables
├── .gitignore
├── requirements.txt         # Package dependencies
└── README.md                # Project documentation
```

## Future Enhancements

- Frontend dashboard for easy management
- Scheduled scans with notifications
- Detailed reporting and vulnerability tracking
- Integration with more security tools
- Support for custom scan configurations
- Team collaboration features

## License

This project is licensed under the MIT License - see the LICENSE file for details.