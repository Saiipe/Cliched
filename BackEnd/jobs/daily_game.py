"""Entry point for the daily-challenge generation job.

Not wired to a scheduler yet — run manually or from a future Celery/
APScheduler beat. Kept isolated here so integrating a real scheduler later
doesn't touch app code.
"""


def run():
    raise NotImplementedError
