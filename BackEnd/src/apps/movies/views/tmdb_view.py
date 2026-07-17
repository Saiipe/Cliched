import requests
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.movies.services.tmdb_service import TMDBService
from shared.responses.api_response import error_response, success_response


class TMDBSearchView(APIView):
    """Temporary AllowAny endpoint to exercise the TMDB integration end to
    end. Tighten permissions once movies has real auth-gated endpoints."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Buscar filmes (TMDB)",
        description="Proxy da busca do TMDB, usado pelo autocomplete de palpites.",
        parameters=[
            OpenApiParameter(name="query", type=OpenApiTypes.STR, required=True,
                             description="Texto de busca (nome do filme)."),
        ],
        responses={200: OpenApiTypes.OBJECT, 429: OpenApiTypes.OBJECT, 502: OpenApiTypes.OBJECT},
        tags=["movies"],
    )
    def get(self, request):
        query = request.query_params.get("query", "").strip()
        if not query:
            return error_response(message="O parâmetro 'query' é obrigatório.", status=400)

        try:
            data = TMDBService().search_movies(query)
        except requests.HTTPError as exc:
            status_code = exc.response.status_code if exc.response is not None else 502
            if status_code == 429:
                return error_response(
                    message="TMDB está limitando as requisições no momento. Tente novamente em instantes.",
                    status=429,
                )
            return error_response(message="Falha ao consultar o TMDB.", status=502)
        except requests.RequestException:
            return error_response(message="TMDB indisponível no momento.", status=502)

        return success_response(data=data)
