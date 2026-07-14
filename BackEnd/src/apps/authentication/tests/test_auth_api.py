from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

User = get_user_model()


class AuthAPITests(APITestCase):
    def register(self, **overrides):
        payload = {
            "username": "player",
            "email": "player@example.com",
            "password": "senha-forte-123",
        }
        payload.update(overrides)
        return self.client.post("/api/v1/auth/register/", payload)

    def test_register_creates_user_and_returns_tokens(self):
        response = self.register()
        self.assertEqual(response.status_code, 201)
        data = response.json()["data"]
        self.assertIn("access", data["tokens"])
        self.assertIn("refresh", data["tokens"])
        self.assertNotIn("password", data["user"])
        self.assertTrue(User.objects.filter(username="player").exists())

    def test_register_rejects_weak_password(self):
        response = self.register(password="123")
        self.assertEqual(response.status_code, 400)

    def test_register_rejects_duplicate_email(self):
        self.register()
        response = self.register(username="other")
        self.assertEqual(response.status_code, 400)

    def test_login_and_refresh(self):
        self.register()
        login = self.client.post(
            "/api/v1/auth/login/", {"username": "player", "password": "senha-forte-123"}
        )
        self.assertEqual(login.status_code, 200)
        refresh_token = login.json()["refresh"]

        refreshed = self.client.post("/api/v1/auth/refresh/", {"refresh": refresh_token})
        self.assertEqual(refreshed.status_code, 200)
        self.assertIn("access", refreshed.json())

    def test_login_wrong_password(self):
        self.register()
        response = self.client.post(
            "/api/v1/auth/login/", {"username": "player", "password": "errada"}
        )
        self.assertEqual(response.status_code, 401)
