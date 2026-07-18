from unittest.mock import Mock, patch

import requests
from django.core.mail import EmailMultiAlternatives, send_mail
from django.test import SimpleTestCase, override_settings

from shared.email.backends.resend_backend import RESEND_API_URL, ResendEmailBackend


@override_settings(RESEND_API_KEY="re_test_key")
class ResendEmailBackendTests(SimpleTestCase):
    @patch("shared.email.backends.resend_backend.requests.post")
    def test_sends_plain_text_email_via_resend_api(self, mock_post):
        mock_post.return_value = Mock(status_code=200, raise_for_status=lambda: None)

        sent = send_mail(
            subject="Assunto",
            message="Corpo em texto puro.",
            from_email="Cliched <onboarding@resend.dev>",
            recipient_list=["jogador@example.com"],
            connection=ResendEmailBackend(),
        )

        self.assertEqual(sent, 1)
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertEqual(args[0], RESEND_API_URL)
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer re_test_key")
        self.assertEqual(kwargs["json"]["to"], ["jogador@example.com"])
        self.assertEqual(kwargs["json"]["subject"], "Assunto")
        self.assertNotIn("html", kwargs["json"])

    @patch("shared.email.backends.resend_backend.requests.post")
    def test_sends_html_alternative_when_present(self, mock_post):
        mock_post.return_value = Mock(status_code=200, raise_for_status=lambda: None)

        message = EmailMultiAlternatives(
            subject="Assunto",
            body="Texto puro",
            from_email="Cliched <onboarding@resend.dev>",
            to=["jogador@example.com"],
        )
        message.attach_alternative("<p>HTML</p>", "text/html")
        message.connection = ResendEmailBackend()

        sent = message.send()

        self.assertEqual(sent, 1)
        _, kwargs = mock_post.call_args
        self.assertEqual(kwargs["json"]["html"], "<p>HTML</p>")

    @patch("shared.email.backends.resend_backend.requests.post")
    def test_failure_is_silent_by_default_and_reported_when_not(self, mock_post):
        mock_post.side_effect = requests.exceptions.ConnectionError("boom")

        silent = ResendEmailBackend(fail_silently=True)
        sent = send_mail(
            subject="Assunto",
            message="Corpo",
            from_email="Cliched <onboarding@resend.dev>",
            recipient_list=["jogador@example.com"],
            connection=silent,
        )
        self.assertEqual(sent, 0)

        loud = ResendEmailBackend(fail_silently=False)
        with self.assertRaises(requests.exceptions.ConnectionError):
            send_mail(
                subject="Assunto",
                message="Corpo",
                from_email="Cliched <onboarding@resend.dev>",
                recipient_list=["jogador@example.com"],
                connection=loud,
            )
