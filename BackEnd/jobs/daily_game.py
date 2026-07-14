"""Entry point for the daily-challenge generation job.

Not wired to a scheduler yet — run manually (`python jobs/daily_game.py`)
or from a future Celery/APScheduler beat. Kept isolated here so integrating
a real scheduler later doesn't touch app code.

Idempotent: DailyChallenge.date is unique, so re-running on the same day
just returns the existing challenge.
"""

import os
import sys
from pathlib import Path


def _bootstrap():
    src = Path(__file__).resolve().parent.parent / "src"
    sys.path.insert(0, str(src))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
    import django

    django.setup()


def run():
    _bootstrap()
    from apps.games.services.daily_challenge_service import DailyChallengeService

    challenge = DailyChallengeService().get_or_create_today()
    print(f"Daily challenge ready: id={challenge.pk} date={challenge.date}")
    return challenge


if __name__ == "__main__":
    run()
