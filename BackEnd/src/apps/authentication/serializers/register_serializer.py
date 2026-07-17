from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Cadastro público.

    A lista de `fields` é a whitelist de segurança: flags como
    is_superuser (admin) e is_premium ficam de fora de propósito: só
    podem ser alteradas direto no banco, nunca por payload do cliente."""

    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    accept_terms = serializers.BooleanField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "password_confirm", "accept_terms"]
        extra_kwargs = {"email": {"required": True}}

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Já existe uma conta com este e-mail.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_accept_terms(self, value):
        if not value:
            raise serializers.ValidationError(
                "É preciso aceitar os termos de uso para criar a conta."
            )
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "As senhas não conferem."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        validated_data.pop("accept_terms")
        return User.objects.create_user(**validated_data)
