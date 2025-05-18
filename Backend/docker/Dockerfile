# docker/Dockerfile
FROM python:3.9-slim

# Install necessary system dependencies for security tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    dnsutils \  # for dig command
    nmap \
    sslscan \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
