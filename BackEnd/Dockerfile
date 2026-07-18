# Production Dockerfile for Django app
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# install python deps
COPY requirements /app/requirements
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && pip install --no-cache-dir -r requirements/prod.txt

# copy project
COPY src /app/src
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
#COPY .env /app/.env

RUN chmod +x /app/docker-entrypoint.sh

ENV PYTHONPATH=/app/src
WORKDIR /app/src

EXPOSE 8000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
