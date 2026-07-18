from django.urls import path

from apps.users.views.admin_user_views import (
    AdminUserListView,
    AdminUserLoginHistoryView,
    AdminUserToggleActiveView,
)
from apps.users.views.me_view import MeView

app_name = "users"

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("admin/", AdminUserListView.as_view(), name="admin-list"),
    path(
        "admin/<int:user_id>/logins/",
        AdminUserLoginHistoryView.as_view(),
        name="admin-login-history",
    ),
    path(
        "admin/<int:user_id>/toggle-active/",
        AdminUserToggleActiveView.as_view(),
        name="admin-toggle-active",
    ),
]
