from django.urls import path

from apps.rankings.views.ranking_settings_view import RankingSettingsView
from apps.rankings.views.ranking_views import RankingListView

app_name = "rankings"

urlpatterns = [
    path("", RankingListView.as_view(), name="list"),
    path("settings/", RankingSettingsView.as_view(), name="settings"),
]
