from rest_framework import serializers


class RankingEntrySerializer(serializers.Serializer):
    """Forma pública de uma linha do ranking (documentação/validação do
    contrato; jamais expõe user_id nem distingue visualmente mocks além
    da flag `is_real`, que o frontend hoje ignora)."""

    position = serializers.IntegerField()
    player_name = serializers.CharField()
    points = serializers.IntegerField()
    streak = serializers.IntegerField()
    is_real = serializers.BooleanField()
