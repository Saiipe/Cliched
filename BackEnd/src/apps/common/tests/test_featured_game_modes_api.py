from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.common.models import FeaturedGameMode

User = get_user_model()


class FeaturedGameModesApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin", password="senha-forte-123", is_superuser=True
        )
        self.client.force_authenticate(self.admin)

    def get(self):
        return self.client.get("/api/v1/common/featured-game-modes/")

    def set(self, game_mode_ids):
        return self.client.post(
            "/api/v1/common/featured-game-modes/", {"game_mode_ids": game_mode_ids}
        )

    def test_get_is_public_even_without_auth(self):
        self.client.force_authenticate(None)
        response = self.get()
        self.assertEqual(response.status_code, 200)

    def test_set_requires_admin(self):
        self.client.force_authenticate(None)
        response = self.set(["daily"])
        self.assertEqual(response.status_code, 401)

    def test_set_rejects_non_admin_user(self):
        player = User.objects.create_user(username="player", password="senha-forte-123")
        self.client.force_authenticate(player)
        response = self.set(["daily"])
        self.assertEqual(response.status_code, 403)

    def test_get_empty_by_default(self):
        response = self.get()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["game_mode_ids"], [])

    def test_set_replaces_the_whole_list_in_order(self):
        response = self.set(["daily", "synopsis", "cast"])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["game_mode_ids"], ["daily", "synopsis", "cast"])

        # A second write fully replaces the first, including the order.
        response = self.set(["cast", "daily"])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["game_mode_ids"], ["cast", "daily"])
        self.assertEqual(FeaturedGameMode.objects.count(), 2)

    def test_get_reflects_last_set(self):
        self.set(["frame", "quotes"])
        response = self.get()
        self.assertEqual(response.json()["data"]["game_mode_ids"], ["frame", "quotes"])

    def test_set_rejects_non_list(self):
        response = self.client.post(
            "/api/v1/common/featured-game-modes/", {"game_mode_ids": "daily"}
        )
        self.assertEqual(response.status_code, 400)

    def test_set_rejects_non_string_items(self):
        response = self.client.post(
            "/api/v1/common/featured-game-modes/", {"game_mode_ids": [1, 2]}
        )
        self.assertEqual(response.status_code, 400)

    def test_set_empty_list_clears_all(self):
        self.set(["daily"])
        response = self.set([])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["game_mode_ids"], [])
