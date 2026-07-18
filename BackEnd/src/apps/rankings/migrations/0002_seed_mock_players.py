"""Popula os jogadores fictícios do ranking a partir de
`apps.rankings.mock_data.players`. As datas são relativas ao momento em que
a migração roda, para os mocks nascerem parecendo ativos."""
from datetime import timedelta

from django.db import migrations
from django.utils import timezone


def seed_mock_players(apps, schema_editor):
    from apps.rankings.mock_data.players import MOCK_PLAYERS

    MockPlayer = apps.get_model("rankings", "MockPlayer")
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
        )
        for player in MOCK_PLAYERS
    )


def unseed_mock_players(apps, schema_editor):
    apps.get_model("rankings", "MockPlayer").objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("rankings", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_mock_players, unseed_mock_players),
    ]
