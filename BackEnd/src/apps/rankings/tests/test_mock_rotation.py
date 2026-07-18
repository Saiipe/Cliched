from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.rankings.models import MockPlayer
from apps.rankings.services.mock_rotation_service import MockPlayerRotationService

User = get_user_model()


class MockPlayerRotationTests(APITestCase):
    def test_swap_deactivates_colliding_mock_and_activates_a_reserve_one(self):
        colliding = MockPlayer.objects.filter(is_active=True).first()
        self.assertIsNotNone(colliding)

        MockPlayerRotationService.swap_if_collision(colliding.display_name)

        colliding.refresh_from_db()
        self.assertFalse(colliding.is_active)
        self.assertEqual(MockPlayer.objects.filter(is_active=True).count(), 10)

    def test_swap_is_case_insensitive(self):
        colliding = MockPlayer.objects.filter(is_active=True).first()

        MockPlayerRotationService.swap_if_collision(colliding.display_name.upper())

        colliding.refresh_from_db()
        self.assertFalse(colliding.is_active)

    def test_swap_does_nothing_without_collision(self):
        active_before = set(
            MockPlayer.objects.filter(is_active=True).values_list("id", flat=True)
        )

        MockPlayerRotationService.swap_if_collision("NomeQueNenhumMockUsa123")

        active_after = set(
            MockPlayer.objects.filter(is_active=True).values_list("id", flat=True)
        )
        self.assertEqual(active_before, active_after)

    def test_registering_with_a_mock_name_rotates_it_out(self):
        colliding = MockPlayer.objects.filter(is_active=True).first()
        name = colliding.display_name

        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "username": name,
                "email": f"{name.lower()}@example.com",
                "password": "senha-forte-123",
                "password_confirm": "senha-forte-123",
                "accept_terms": True,
            },
        )
        self.assertEqual(response.status_code, 201)

        colliding.refresh_from_db()
        self.assertFalse(colliding.is_active)
        self.assertEqual(MockPlayer.objects.filter(is_active=True).count(), 10)

        # O usuário real recém-cadastrado ainda não venceu nada (não entra
        # no ranking até a primeira vitória, ver RankingService); o que
        # este teste garante é que o *mock* saiu e não ficou duplicado.
        ranking = self.client.get("/api/v1/rankings/?type=points&period=all&limit=100")
        names = [e["player_name"] for e in ranking.json()["data"]["entries"]]
        self.assertEqual(names.count(name), 0)
