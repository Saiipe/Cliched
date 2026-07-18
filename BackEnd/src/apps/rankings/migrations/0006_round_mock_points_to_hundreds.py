"""Corrige os pontos dos mocks pra só usar valores realmente alcançáveis
no jogo: cada sessão vencida vale INITIAL_SCORE (1000) menos um múltiplo
de WRONG_GUESS_PENALTY (100) — ou seja, só 600/700/800/900/1000 por
vitória (`apps.games.constants`). Qualquer soma dessas parcelas é sempre
múltiplo de 100; vários mocks tinham `weekly_points`/`monthly_points`/
`total_points` que não eram (ex.: 12840, 950), pontuações que nenhum
jogador real jamais conseguiria fazer. `mock_data/players.py` já foi
arredondado pra múltiplos de 100 (sem quebrar semana ≤ mês ≤ geral);
esta migração só reseeda a partir dele, mesma receita das anteriores."""
from datetime import timedelta

from django.db import migrations
from django.utils import timezone


def reseed_rounded(apps, schema_editor):
    from apps.rankings.mock_data.players import MOCK_PLAYERS

    MockPlayer = apps.get_model("rankings", "MockPlayer")
    MockPlayer.objects.all().delete()

    now = timezone.now()
    MockPlayer.objects.bulk_create(
        MockPlayer(
            display_name=player["display_name"],
            weekly_points=player["weekly_points"],
            monthly_points=player["monthly_points"],
            total_points=player["total_points"],
            weekly_streak=player["weekly_streak"],
            monthly_streak=player["monthly_streak"],
            best_streak=player["best_streak"],
            streak_achieved_on=(
                now - timedelta(days=player["streak_days_ago"])
            ).date(),
            last_activity_at=now - timedelta(days=player["last_activity_days_ago"]),
            is_active=player["is_active"],
        )
        for player in MOCK_PLAYERS
    )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("rankings", "0005_reseed_mock_players_with_roster"),
    ]

    operations = [
        migrations.RunPython(reseed_rounded, noop_reverse),
    ]
