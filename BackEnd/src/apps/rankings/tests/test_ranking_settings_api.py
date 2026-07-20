from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APITestCase

from apps.rankings.models import RankingSettings

User = get_user_model()


class RankingSettingsApiTests(APITestCase):
    """Os mocks usados aqui vêm do roster ativo semeado pela migração
    0005 (10 `MockPlayer.is_active=True` de largada) — não precisa criar
    nenhum, só exercitar o toggle sobre o que já existe."""

    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user(
            username="admin", password="senha-forte-123", is_superuser=True
        )
        self.client.force_authenticate(self.admin)

    def test_get_returns_enabled_by_default(self):
        response = self.client.get("/api/v1/rankings/settings/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["data"]["mocks_enabled"])

    def test_post_rejects_non_boolean(self):
        response = self.client.post("/api/v1/rankings/settings/", {"mocks_enabled": "sim"})
        self.assertEqual(response.status_code, 400)

    def test_disabling_mocks_removes_them_from_ranking(self):
        response = self.client.get("/api/v1/rankings/?type=points&period=all")
        self.assertTrue(response.json()["data"]["entries"])

        toggle = self.client.post("/api/v1/rankings/settings/", {"mocks_enabled": False})
        self.assertEqual(toggle.status_code, 200)
        self.assertFalse(toggle.json()["data"]["mocks_enabled"])

        # O ranking cacheia por até 120s (ver RankingService); o teste
        # limpa o cache pra checar o efeito do toggle sem esperar o TTL,
        # igual a um reload da página depois do cache expirar em produção.
        cache.clear()
        response = self.client.get("/api/v1/rankings/?type=points&period=all")
        self.assertEqual(response.json()["data"]["entries"], [])

    def test_reenabling_mocks_brings_them_back(self):
        self.client.post("/api/v1/rankings/settings/", {"mocks_enabled": False})
        self.client.post("/api/v1/rankings/settings/", {"mocks_enabled": True})
        cache.clear()

        response = self.client.get("/api/v1/rankings/?type=points&period=all")
        self.assertTrue(response.json()["data"]["entries"])

    def test_settings_is_a_singleton(self):
        RankingSettings.current()
        RankingSettings.current()
        self.assertEqual(RankingSettings.objects.count(), 1)
