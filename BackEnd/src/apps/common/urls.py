from django.urls import path

from apps.common.views.featured_game_modes_view import FeaturedGameModesView

app_name = "common"

urlpatterns = [
    path(
        "featured-game-modes/",
        FeaturedGameModesView.as_view(),
        name="featured-game-modes",
    ),
]
