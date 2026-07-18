from datetime import date

from django.test import SimpleTestCase

from shared.services.streak_calculator import best_streak, current_streak


class StreakCalculatorTests(SimpleTestCase):
    def test_current_streak_counts_back_from_today(self):
        today = date(2026, 7, 18)
        dates = {date(2026, 7, 16), date(2026, 7, 17), date(2026, 7, 18)}
        self.assertEqual(current_streak(dates, today), 3)

    def test_current_streak_still_alive_if_today_pending(self):
        today = date(2026, 7, 18)
        dates = {date(2026, 7, 16), date(2026, 7, 17)}
        self.assertEqual(current_streak(dates, today), 2)

    def test_current_streak_broken_two_days_ago(self):
        today = date(2026, 7, 18)
        self.assertEqual(current_streak({date(2026, 7, 15)}, today), 0)
        self.assertEqual(current_streak(set(), today), 0)

    def test_best_streak_finds_longest_run_and_end_date(self):
        dates = [
            date(2026, 7, 1),
            date(2026, 7, 2),
            # buraco
            date(2026, 7, 10),
            date(2026, 7, 11),
            date(2026, 7, 12),
        ]
        self.assertEqual(best_streak(dates), (3, date(2026, 7, 12)))

    def test_best_streak_tie_keeps_most_recent(self):
        dates = [date(2026, 7, 1), date(2026, 7, 2), date(2026, 7, 10), date(2026, 7, 11)]
        self.assertEqual(best_streak(dates), (2, date(2026, 7, 11)))

    def test_best_streak_empty(self):
        self.assertEqual(best_streak([]), (0, None))
