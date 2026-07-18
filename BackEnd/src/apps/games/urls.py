from django.urls import path

from apps.games.views.admin_views import (
    AdvanceChallengeAdminView,
    CurrentChallengeAdminView,
    NextChallengeAdminView,
    NextChallengeImageAdminView,
    NextChallengeImageGalleryAdminView,
    SwapNextChallengeAdminView,
)
from apps.games.views.cast_admin_views import (
    CurrentCastChallengeAdminView,
    NextCastChallengeAdminView,
    SwapNextCastChallengeAdminView,
)
from apps.games.views.cast_views import CastChallengeView, CastGuessView
from apps.games.views.daily_views import (
    DailyChallengeView,
    DailyGuessView,
    DailyHistoryView,
    DailyPosterView,
)

app_name = "games"

urlpatterns = [
    path("cast/", CastChallengeView.as_view(), name="cast"),
    path("cast/guess/", CastGuessView.as_view(), name="cast-guess"),
    path("cast/current/", CurrentCastChallengeAdminView.as_view(), name="cast-current"),
    path("cast/next/", NextCastChallengeAdminView.as_view(), name="cast-next"),
    path("cast/next/swap/", SwapNextCastChallengeAdminView.as_view(), name="cast-next-swap"),
    path("daily/", DailyChallengeView.as_view(), name="daily"),
    path("daily/guess/", DailyGuessView.as_view(), name="daily-guess"),
    path("daily/poster/", DailyPosterView.as_view(), name="daily-poster"),
    path("daily/history/", DailyHistoryView.as_view(), name="daily-history"),
    path("daily/current/", CurrentChallengeAdminView.as_view(), name="daily-current"),
    path("daily/next/", NextChallengeAdminView.as_view(), name="daily-next"),
    path("daily/next/swap/", SwapNextChallengeAdminView.as_view(), name="daily-next-swap"),
    path("daily/next/image/", NextChallengeImageAdminView.as_view(), name="daily-next-image"),
    path(
        "daily/next/image/gallery/",
        NextChallengeImageGalleryAdminView.as_view(),
        name="daily-next-image-gallery",
    ),
    path("daily/advance/", AdvanceChallengeAdminView.as_view(), name="daily-advance"),
]
