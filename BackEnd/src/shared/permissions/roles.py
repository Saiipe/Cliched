from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)


class IsModerator(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, "is_moderator", False))


class IsPremium(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, "is_premium", False))


class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        owner_id = getattr(obj, "user_id", None)
        return owner_id == getattr(request.user, "id", None)
