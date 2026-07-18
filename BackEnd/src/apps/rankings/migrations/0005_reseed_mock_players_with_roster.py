"""Reseed dos mocks pra aplicar o roster fixo de 10 ativos + 46 de
reserva (20 nicknames novos pedidos em 2026-07-18, ver `mock_data/
players.py`). Mesma receita das migrações 0002/0003: apaga e recria a
partir da fonte única, mais simples e seguro que casar linha a linha com
o estado anterior."""
from datetime import timedelta

from django.db import migrations
from django.utils import timezone


def reseed_with_roster(apps, schema_editor):
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
        ("rankings", "0004_mockplayer_is_active"),
    ]

    operations = [
        migrations.RunPython(reseed_with_roster, noop_reverse),
    ]
