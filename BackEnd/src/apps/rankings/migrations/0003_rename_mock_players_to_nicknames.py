"""Troca os `display_name` de "nome e sobrenome" pra nicknames no estilo
dos usuários reais (pedido explícito em 2026-07-18). Apaga e recria a
partir de `apps.rankings.mock_data.players`, já atualizado com os novos
nomes: mais simples e seguro do que casar linha a linha com o estado
anterior (migrations não devem importar de outras migrations)."""
from datetime import timedelta

from django.db import migrations
from django.utils import timezone


def rename_to_nicknames(apps, schema_editor):
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
        )
        for player in MOCK_PLAYERS
    )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("rankings", "0002_seed_mock_players"),
    ]

    operations = [
        migrations.RunPython(rename_to_nicknames, noop_reverse),
    ]
