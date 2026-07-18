"""Matemática pura de sequências (streaks) sobre datas de vitória.

Funções sem acesso a banco, compartilhadas entre o perfil do usuário
(`apps.users`) e o sistema de ranking (`apps.rankings`), para que a régua
de "sequência" seja uma só na aplicação inteira.
"""
from datetime import date, timedelta
from typing import Iterable


def current_streak(won_dates: set[date], today: date) -> int:
    """Sequência de dias consecutivos vencidos terminando hoje ou ontem.

    Se o desafio de hoje ainda não foi vencido, a sequência que terminou
    ontem continua valendo (ainda dá tempo de mantê-la hoje).
    """
    if not won_dates:
        return 0

    day = today if today in won_dates else today - timedelta(days=1)
    streak = 0
    while day in won_dates:
        streak += 1
        day -= timedelta(days=1)
    return streak


def best_streak(won_dates: Iterable[date]) -> tuple[int, date | None]:
    """Maior sequência de dias consecutivos e a data em que ela terminou.

    Empates entre sequências de mesmo tamanho ficam com a mais recente,
    que é o critério de desempate dos rankings.
    """
    ordered = sorted(set(won_dates))
    if not ordered:
        return 0, None

    best_length, best_end = 1, ordered[0]
    run_length, run_end = 1, ordered[0]

    for previous, current in zip(ordered, ordered[1:]):
        if current - previous == timedelta(days=1):
            run_length += 1
        else:
            run_length = 1
        run_end = current
        if run_length >= best_length:
            best_length, best_end = run_length, run_end

    return best_length, best_end
