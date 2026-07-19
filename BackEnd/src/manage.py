#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Precisa carregar o .env AQUI, antes do setdefault abaixo: o Django resolve
# qual módulo de settings importar assim que DJANGO_SETTINGS_MODULE existe no
# ambiente, e o load_dotenv() de config/settings/base.py só roda depois que
# esse módulo já foi escolhido e importado — tarde demais pra mudar a decisão.
load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
