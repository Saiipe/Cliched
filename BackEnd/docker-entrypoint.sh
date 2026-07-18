#!/bin/sh
set -e

# Load environment variables if present
if [ -f "/app/.env" ]; then
  eval "$(python - <<'PY'
from dotenv import dotenv_values
from shlex import quote

for key, value in dotenv_values('/app/.env').items():
    if value is None:
        continue
    print(f'export {key}={quote(value)}')
PY
  )"
fi

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --worker-class gthread \
  --workers "${GUNICORN_WORKERS:-2}" \
  --threads "${GUNICORN_THREADS:-4}" \
  --timeout "${GUNICORN_TIMEOUT:-120}" \
  --graceful-timeout "${GUNICORN_GRACEFUL_TIMEOUT:-30}" \
  --keep-alive "${GUNICORN_KEEPALIVE:-5}" \
  --log-level info
