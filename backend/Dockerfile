FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libexpat1 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --default-timeout=1000 -r requirements.txt

# Copy backend source files
COPY app/ ./app/
COPY data/ ./data/

# Create the data folder if it doesn't exist
RUN mkdir -p data && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose FastAPI port
EXPOSE 8000

# Run FastAPI with a single process. The reload watcher doubles memory during
# heavy GIS imports and can OOM-kill the container after Docker restarts.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
