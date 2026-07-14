from rest_framework.response import Response


def success_response(data=None, message="", status=200, **extra):
    payload = {"success": True, "message": message, "data": data}
    payload.update(extra)
    return Response(payload, status=status)


def error_response(message="", errors=None, status=400, **extra):
    payload = {"success": False, "message": message, "errors": errors}
    payload.update(extra)
    return Response(payload, status=status)
