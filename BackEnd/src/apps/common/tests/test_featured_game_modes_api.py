from rest_framework.test import APITestCase

from apps.common.models import FeaturedGameMode


class FeaturedGameModesApiTests(APITestCase):
    def get(self):
        return self.client.get("/api/v1/common/featured-game-modes/")

    def set(self, game_mode_ids):
        return self.client.post(
            "/api/v1/common/featured-game-modes/", {"game_mode_ids": game_mode_ids}
        )

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
