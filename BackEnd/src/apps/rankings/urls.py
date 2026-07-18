from django.urls import path

from apps.rankings.views.ranking_views import RankingListView

app_name = "rankings"

urlpatterns = [
    path("", RankingListView.as_view(), name="list"),
]
