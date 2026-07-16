from django.urls import path

from apps.users.views.me_view import MeView

app_name = "users"

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
]
