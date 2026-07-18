from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.authentication.views.auth_views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
    UsernameAvailabilityView,
)

app_name = "authentication"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path(
        "username-available/",
        UsernameAvailabilityView.as_view(),
        name="username-available",
    ),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path(
        "password-reset/", PasswordResetRequestView.as_view(), name="password-reset"
    ),
    path(
        "password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
]
