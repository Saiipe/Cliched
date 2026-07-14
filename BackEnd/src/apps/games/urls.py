from django.urls import path

from apps.games.views.admin_views import (
    NextChallengeAdminView,
    SwapNextChallengeAdminView,
)
from apps.games.views.daily_views import (
    DailyChallengeView,
    DailyGuessView,
    DailyHistoryView,
    DailyPosterView,
)

app_name = "games"

urlpatterns = [
    path("daily/", DailyChallengeView.as_view(), name="daily"),
    path("daily/guess/", DailyGuessView.as_view(), name="daily-guess"),
    path("daily/poster/", DailyPosterView.as_view(), name="daily-poster"),
    path("daily/history/", DailyHistoryView.as_view(), name="daily-history"),
    path("daily/next/", NextChallengeAdminView.as_view(), name="daily-next"),
    path("daily/next/swap/", SwapNextChallengeAdminView.as_view(), name="daily-next-swap"),
]
