# Cliched: Backend

API em Django + Django REST Framework para o "Cliched", plataforma de jogos sobre cinema (frontend em `../frontEnd/projeto_cinema`).

Sem Django admin: o painel administrativo é o do frontend.

## Setup

```bash
python -m venv .venv           # já existe em .venv/
source .venv/bin/activate
pip install -r requirements/dev.txt
cp .env.example .env           # ajuste os valores se necessário
cd src
python manage.py migrate
python manage.py runserver
```

API disponível em `http://localhost:8000/api/v1/`.

## Estrutura

- `src/config/settings/`: `base.py` + `development.py` / `production.py` / `test.py`
- `src/apps/`: um app Django por domínio (`authentication`, `users`, `movies`, `games`, `rankings`, `achievements`, `advertisements`, `metrics`, `ai`, `common`), cada um com `models/ serializers/ services/ repositories/ views/ permissions/ tests/`
- `src/shared/`: código reaproveitável entre apps (exceptions, permissions, pagination, middleware, responses, validators, mixins, services, cache, constants)
- `jobs/`: pontos de entrada para tarefas agendadas (ainda não ligados a um scheduler)
- `requirements/`: `base.txt` / `dev.txt` / `prod.txt`

### Camadas dentro de cada app

- **models**: só estrutura de dados
- **repositories**: acesso ao banco
- **services**: regra de negócio
- **views**: recebem request, chamam service, retornam response, sem lógica de negócio
