"""Hand-rolled Google OAuth 2.0 "offline access" flow for linking a user's
YouTube account (separate from Firebase login — this is what gets us a
refresh token so we can keep reading their liked videos/subscriptions/
playlists later, not just identify them once)."""
from urllib.parse import urlencode

import requests
from django.conf import settings

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
SCOPE = "https://www.googleapis.com/auth/youtube.readonly"


def redirect_uri():
    return f"{settings.PUBLIC_BASE_URL}/api/youtube/callback"


def build_auth_url(state):
    params = {
        "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
        "redirect_uri": redirect_uri(),
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
        "state": state,
    }
    return f"{AUTH_URL}?{urlencode(params)}"


def exchange_code(code):
    data = {
        "code": code,
        "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
        "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET,
        "redirect_uri": redirect_uri(),
        "grant_type": "authorization_code",
    }
    resp = requests.post(TOKEN_URL, data=data, timeout=8)
    resp.raise_for_status()
    return resp.json()  # access_token, refresh_token, expires_in, ...


def refresh_access_token(refresh_token):
    data = {
        "refresh_token": refresh_token,
        "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
        "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET,
        "grant_type": "refresh_token",
    }
    resp = requests.post(TOKEN_URL, data=data, timeout=8)
    resp.raise_for_status()
    return resp.json()  # access_token, expires_in, ... (no new refresh_token)
