from rest_framework.views import exception_handler

from shared.responses.api_response import error_response


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return None

    message = response.data.get("detail", "") if isinstance(response.data, dict) else ""
    return error_response(message=str(message), errors=response.data, status=response.status_code)
