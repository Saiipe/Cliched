from django.core.cache import cache


class CacheService:
    """Thin wrapper around Django's cache framework.

    Uses the LocMemCache backend today; swapping CACHES in settings to
    Redis later requires no changes here or in any caller.
    """

    @staticmethod
    def get(key, default=None):
        return cache.get(key, default)

    @staticmethod
    def set(key, value, timeout=300):
        cache.set(key, value, timeout)

    @staticmethod
    def delete(key):
        cache.delete(key)

    @staticmethod
    def get_or_set(key, callable_fn, timeout=300):
        return cache.get_or_set(key, callable_fn, timeout)
