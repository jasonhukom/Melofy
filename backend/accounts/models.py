from django.db import models


class YouTubeAccount(models.Model):
    """One linked Google/YouTube account per Firebase user. Holds an OAuth
    refresh token so we can keep fetching the user's liked videos,
    subscriptions and playlists without asking them to sign in again."""

    firebase_uid = models.CharField(max_length=128, unique=True)
    email = models.EmailField(blank=True)
    display_name = models.CharField(max_length=255, blank=True)
    refresh_token = models.TextField()
    access_token = models.TextField(blank=True)
    token_expiry = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.email or self.firebase_uid


class OAuthState(models.Model):
    """Short-lived record correlating an outbound Google OAuth redirect (or,
    on Android, a post-login handoff) back to a Firebase user — looked up by
    an opaque token instead of a session cookie, since the callback can
    arrive from a different cookie context (Chrome Custom Tabs) than the
    request that started it. Rows are deleted as soon as they're used."""

    token = models.CharField(max_length=64, unique=True)
    firebase_uid = models.CharField(max_length=128)
    email = models.EmailField(blank=True)
    display_name = models.CharField(max_length=255, blank=True)
    platform = models.CharField(max_length=20, default="web")  # "web" or "android"
    purpose = models.CharField(max_length=20, default="youtube_connect")  # or "login_handoff"
    created_at = models.DateTimeField(auto_now_add=True)
