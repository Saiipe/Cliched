from django.db import transaction

from apps.common.models import FeaturedGameMode


class FeaturedGameModesService:
    """Reads/writes the ordered list of game modes highlighted on the home
    page. The whole list is replaced on every write — there's no per-item
    CRUD need here, the admin picker always sends the full ordered set."""

    def list_ids(self) -> list[str]:
        return list(
            FeaturedGameMode.objects.order_by("order").values_list("game_mode_id", flat=True)
        )

    def set_ids(self, game_mode_ids: list[str]) -> list[str]:
        with transaction.atomic():
            FeaturedGameMode.objects.all().delete()
            FeaturedGameMode.objects.bulk_create(
                FeaturedGameMode(game_mode_id=game_mode_id, order=index)
                for index, game_mode_id in enumerate(game_mode_ids)
            )
        return self.list_ids()
