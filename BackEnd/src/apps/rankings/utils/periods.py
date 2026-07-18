"""Janelas de tempo dos rankings.

"Semana" e "mês" são janelas móveis (últimos 7/30 dias), não calendário:
janela móvel nunca aparece vazia numa segunda-feira ou dia 1º, e dispensa
qualquer lógica de fuso/virada. Se um dia virar ranking sazonal por
calendário, muda-se só aqui.
"""
from datetime import datetime, timedelta

from django.utils import timezone

PERIOD_WEEK = "week"
PERIOD_MONTH = "month"
PERIOD_ALL = "all"

VALID_PERIODS = (PERIOD_WEEK, PERIOD_MONTH, PERIOD_ALL)

_PERIOD_DAYS = {PERIOD_WEEK: 7, PERIOD_MONTH: 30}


def period_start(period: str) -> datetime | None:
    """Início da janela do período, ou None para o ranking geral."""
    days = _PERIOD_DAYS.get(period)
    if days is None:
        return None
    return timezone.now() - timedelta(days=days)
