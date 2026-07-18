"""Backend de e-mail do Django que entrega via API HTTP do Resend
(https://resend.com/docs/api-reference/emails/send-email), no lugar de
SMTP. Plugado em `EMAIL_BACKEND` quando `RESEND_API_KEY` existe no `.env`
(senão cai pro console, ver `config/settings/base.py`). Implementar como
`BaseEmailBackend` de propósito: qualquer código que já chama
`django.core.mail.send_mail()`/`EmailMultiAlternatives` (como o fluxo de
redefinição de senha) passa a entregar de verdade sem precisar mudar
nada na view.
"""
import logging

import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger("apps")

RESEND_API_URL = "https://api.resend.com/emails"
REQUEST_TIMEOUT_SECONDS = 10


class ResendEmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages) -> int:
        if not email_messages:
            return 0
        return sum(1 for message in email_messages if self._send_one(message))

    def _send_one(self, message) -> bool:
        payload = {
            "from": message.from_email,
            "to": list(message.to),
            "subject": message.subject,
            "text": message.body,
        }
        if message.cc:
            payload["cc"] = list(message.cc)
        if message.bcc:
            payload["bcc"] = list(message.bcc)
        if message.reply_to:
            payload["reply_to"] = list(message.reply_to)

        html_body = _html_alternative_of(message)
        if html_body:
            payload["html"] = html_body

        try:
            response = requests.post(
                RESEND_API_URL,
                json=payload,
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            return True
        except requests.RequestException:
            logger.exception(
                "Falha ao enviar e-mail via Resend (destinatário(s): %s)", message.to
            )
            if not self.fail_silently:
                raise
            return False


def _html_alternative_of(message) -> str | None:
    # `send_mail(html_message=...)`/`EmailMultiAlternatives.attach_alternative`
    # guardam a versão HTML como um "alternative" (content, mimetype).
    for content, mimetype in getattr(message, "alternatives", None) or []:
        if mimetype == "text/html":
            return content
    return None
