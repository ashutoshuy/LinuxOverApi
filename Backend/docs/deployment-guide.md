# Deployment Guide for LinuxOverApi

This guide covers how to deploy the LinuxOverApi service in different environments.

## Local Development Deployment

### Setting Up the Development Environment

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

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with development settings:
   ```
   DATABASE_URL=sqlite:///./api_data.db
   SECRET_KEY=dev-secret-key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=720
   ADMIN_SECRET_KEY=dev-admin-secret
   API_FREE_LIMIT=15
   ```

5. Run the application with hot-reloading:
   ```bash
   uvicorn app.main:app --reload
   ```

## Docker Deployment

### Running with Docker Compose

1. Make sure Docker and Docker Compose are installed on your system:
   ```bash
   docker --version
   docker-compose --version
   ```

2. Create a `.env` file with production settings:
   ```
   DATABASE_URL=sqlite:///./data/api_data.db
   SECRET_KEY=your-production-secret-key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=720
   ADMIN_SECRET_KEY=your-production-admin-secret
   API_FREE_LIMIT=15
   ```

3. Build and start the containers:
   ```bash
   docker-compose up --build -d
   ```

4. Check that the service is running:
   ```bash
   docker-compose ps
   ```

5. View logs:
   ```bash
   docker-compose logs -f
   ```

6. Stop the service:
   ```bash
   docker-compose down
   ```

## Production Deployment

For a production environment, consider the following additional steps:

### Security Considerations

1. Use a strong, unique SECRET_KEY for JWT token generation
2. Set a strong ADMIN_SECRET_KEY
3. Use HTTPS in production (configure with Nginx or similar)
4. Consider using a more robust database (PostgreSQL, MySQL)
5. Implement rate limiting at the application or server level
6. Set up monitoring and logging

### Using Nginx as a Reverse Proxy

1. Install Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Create an Nginx configuration file:
   ```
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. Enable the configuration and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/linuxoverapi /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Using a Production-Ready Database

1. Update the `.env` file to use PostgreSQL:
   ```
   DATABASE_URL=postgresql://user:password@localhost/linuxoverapi
   ```

2. Modify `docker-compose.yml` to include a PostgreSQL service:
   ```yaml
   services:
     api:
       # ... existing api configuration ...
       environment:
         - DATABASE_URL=postgresql://user:password@db/linuxoverapi
       depends_on:
         - db
     
     db:
       image: postgres:13
       volumes:
         - postgres_data:/var/lib/postgresql/data
       environment:
         - POSTGRES_USER=user
         - POSTGRES_PASSWORD=password
         - POSTGRES_DB=linuxoverapi
       ports:
         - "5432:5432"
   
   volumes:
     postgres_data:
   ```

3. Update the code to use SQLAlchemy with PostgreSQL by installing the psycopg2 package:
   ```bash
   pip install psycopg2-binary
   ```

### Setting Up a Systemd Service (for non-Docker deployments)

1. Create a systemd service file:
   ```bash
   sudo nano /etc/systemd/system/linuxoverapi.service
   ```

2. Add the following content:
   ```
   [Unit]
   Description=LinuxOverApi Service
   After=network.target
   
   [Service]
   User=yourusername
   Group=yourusername
   WorkingDirectory=/path/to/LinuxOverApi-MVP
   Environment="PATH=/path/to/LinuxOverApi-MVP/venv/bin"
   EnvironmentFile=/path/to/LinuxOverApi-MVP/.env
   ExecStart=/path/to/LinuxOverApi-MVP/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
   
   Restart=on-failure
   RestartSec=5s
   
   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl enable linuxoverapi
   sudo systemctl start linuxoverapi
   sudo systemctl status linuxoverapi
   ```

## Monitoring and Maintenance

### Setting up Basic Monitoring

1. Check the API health endpoint:
   ```bash
   curl http://localhost:8000/health
   ```

2. Set up regular database backups:
   ```bash
   # For SQLite
   cp api_data.db api_data.db.backup-$(date +%Y%m%d)
   
   # For PostgreSQL
   pg_dump -U user linuxoverapi > linuxoverapi-backup-$(date +%Y%m%d).sql
   ```

3. Monitor logs:
   ```bash
   # For systemd service
   sudo journalctl -u linuxoverapi -f
   
   # For Docker
   docker-compose logs -f
   ```

## Troubleshooting

### Common Issues and Solutions

1. **Database connection issues**
   - Check that the database exists and is accessible
   - Verify connection string in `.env` file
   - Ensure database user has appropriate permissions

2. **Permission issues with security tools**
   - Ensure the security tools (nmap, dig, etc.) are installed and accessible
   - Check that the user running the application has permission to execute these tools
   - Try running the tools manually to verify they work

3. **API key authentication failures**
   - Verify that the API key exists in the database
   - Check that the count hasn't exceeded the limit for free tier
   - Ensure the API key is being passed correctly in requests

4. **JWT token issues**
   - Check that the SECRET_KEY is consistent
   - Verify that the token hasn't expired
   - Ensure the token is being passed correctly in requests