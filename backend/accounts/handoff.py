"""Mint/resolve short-lived opaque tokens used two ways:
1. As the OAuth `state` param for the YouTube-connect redirect (carries the
   Firebase uid + which platform started the flow through Google's
   redirect, without relying on a session cookie surviving the round trip).
2. On Android only, as a one-time "handoff code" that the app's WebView
   redeems (via /api/auth/exchange) after a Chrome Custom Tab completes
   sign-in, to establish a real session cookie inside the WebView's own
   storage — Custom Tabs and the WebView do not share cookies.
"""
import secrets
from datetime import timedelta

from django.utils import timezone

from .models import OAuthState

TOKEN_TTL_SECONDS = 300  # 5 minutes is generous for a human to finish a redirect


def mint(firebase_uid, platform="web", purpose="youtube_connect", email="", display_name=""):
    token = secrets.token_urlsafe(24)
    OAuthState.objects.create(
        token=token, firebase_uid=firebase_uid, platform=platform,
        purpose=purpose, email=email, display_name=display_name,
    )
    return token


def resolve(token, purpose=None):
    if not token:
        return None
    cutoff = timezone.now() - timedelta(seconds=TOKEN_TTL_SECONDS)
    try:
        state = OAuthState.objects.get(token=token)
    except OAuthState.DoesNotExist:
        return None
    expired_or_wrong_purpose = state.created_at < cutoff or (purpose and state.purpose != purpose)
    if expired_or_wrong_purpose:
        state.delete()
        return None
    result = {
        "firebase_uid": state.firebase_uid,
        "platform": state.platform,
        "email": state.email,
        "display_name": state.display_name,
    }
    state.delete()  # one-time use
    return result
