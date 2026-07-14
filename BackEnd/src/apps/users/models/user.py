from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    avatar_url = models.URLField(blank=True, default="")
    language = models.CharField(max_length=10, default="pt-br")
    theme = models.CharField(max_length=10, default="dark")
    is_premium = models.BooleanField(default=False)
    is_moderator = models.BooleanField(default=False)
