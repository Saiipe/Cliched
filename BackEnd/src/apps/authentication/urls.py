from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.authentication.views.auth_views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    RegisterView,
)

app_name = "authentication"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
]
