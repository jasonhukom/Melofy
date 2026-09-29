"""Thin wrapper around the Firebase Admin SDK, used only to verify the ID
token the frontend gets from Firebase Auth after a Google sign-in. Reads the
service account key from the FIREBASE_SERVICE_ACCOUNT_JSON env var (the full
JSON content, not a file path) — see README for how to generate one."""
import json

from django.conf import settings

_firebase_app = None
_UNCONFIGURED = object()


def _get_app():
    global _firebase_app
    if _firebase_app is None:
        if not settings.FIREBASE_SERVICE_ACCOUNT_JSON:
            _firebase_app = _UNCONFIGURED
        else:
            import firebase_admin
            from firebase_admin import credentials

            info = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
            cred = credentials.Certificate(info)
            _firebase_app = firebase_admin.initialize_app(cred)
    return _firebase_app


def verify_id_token(id_token):
    """Returns the decoded token dict (with 'uid', 'email', ...) or raises."""
    app = _get_app()
    if app is _UNCONFIGURED:
        raise RuntimeError("Firebase is not configured on the server (FIREBASE_SERVICE_ACCOUNT_JSON not set)")
    from firebase_admin import auth as firebase_auth

    return firebase_auth.verify_id_token(id_token, app=app)
