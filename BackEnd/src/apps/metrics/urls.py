from django.urls import path

from apps.metrics.views.dashboard_view import AdminDashboardStatsView

app_name = "metrics"

urlpatterns = [
    path("dashboard/", AdminDashboardStatsView.as_view(), name="dashboard"),
]
