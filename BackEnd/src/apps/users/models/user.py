from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.core.validators import RegexValidator
from django.db import models

username_no_spaces_validator = RegexValidator(
    regex=r"^\S+$",
    message="O nome de usuário não pode conter espaços.",
)


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError("O username é obrigatório.")
        email = self.normalize_email(email) if email else ""
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(username, email, password, **extra_fields)

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields["is_superuser"] = True
        return self._create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser):
    """Campos são a lista exata definida pelo usuário — não adicionar
    nenhum campo novo sem pedido explícito. `is_superuser` é a flag de
    admin (acesso ao painel `/admin`) e nunca pode ser setável via
    payload de cliente, só direto no banco."""

    username = models.CharField(
        max_length=150,
        unique=True,
        validators=[username_no_spaces_validator],
    )
    email = models.EmailField(blank=True, default="")
    is_superuser = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    is_premium = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []

    def __str__(self) -> str:
        return self.username

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser
