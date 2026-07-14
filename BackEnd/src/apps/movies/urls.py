from django.urls import path

from apps.movies.views.tmdb_view import TMDBSearchView

app_name = "movies"

urlpatterns = [
    path("search/", TMDBSearchView.as_view(), name="tmdb-search"),
]
