"""
URL configuration for config project.

The Django admin site is intentionally not installed: the project ships its
own admin panel in the frontend, so no admin/ route is exposed here.

API routes are versioned from the start under /api/v1/, each local app owns
its own urls.py and is included here.
"""
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

api_v1_patterns = [
    path("common/", include("apps.common.urls")),
    path("auth/", include("apps.authentication.urls")),
    path("users/", include("apps.users.urls")),
    path("movies/", include("apps.movies.urls")),
    path("games/", include("apps.games.urls")),
    path("rankings/", include("apps.rankings.urls")),
    path("achievements/", include("apps.achievements.urls")),
    path("advertisements/", include("apps.advertisements.urls")),
    path("metrics/", include("apps.metrics.urls")),
    path("ai/", include("apps.ai.urls")),
]

urlpatterns = [
    path("api/v1/", include(api_v1_patterns)),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
