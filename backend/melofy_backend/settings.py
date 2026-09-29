"""
Django settings for the Melofy backend.

Every secret (Django's own secret key, the YouTube API key, Google OAuth
client secret, Firebase service account) is read from an environment
variable — never hardcoded here, and never committed to git. See
.env.example for the full list and README.md for where to get each one.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Core ---------------------------------------------------------------

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-only-insecure-key-change-me")
DEBUG = os.environ.get("DJANGO_DEBUG", "False") == "True"

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    ".vercel.app",
]
extra_hosts = os.environ.get("DJANGO_ALLOWED_HOSTS", "")
if extra_hosts:
    ALLOWED_HOSTS += [h.strip() for h in extra_hosts.split(",") if h.strip()]

CSRF_TRUSTED_ORIGINS = ["https://*.vercel.app"]
extra_origins = os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", "")
if extra_origins:
    CSRF_TRUSTED_ORIGINS += [o.strip() for o in extra_origins.split(",") if o.strip()]

# --- Apps -----------------------------------------------------------------

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "core",
    "accounts",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "melofy_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "frontend"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "melofy_backend.wsgi.application"

# --- Database ---------------------------------------------------------------
# Local dev: plain SQLite, zero setup.
# Production (Vercel etc.): set DATABASE_URL to a hosted Postgres — SQLite's
# file storage does not persist reliably on serverless platforms. Vercel
# Postgres, Neon, and Supabase all have free tiers that work well here.

DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    import dj_database_url
    DATABASES = {"default": dj_database_url.parse(DATABASE_URL, conn_max_age=600)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = []  # no password-based accounts — auth is via Firebase

# --- Static files (the frontend lives here) ---------------------------------

STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "frontend"]
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# --- Sessions (used to remember a logged-in Firebase user + linked YouTube account) --

SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 60 * 60 * 24 * 30  # 30 days

# --- Third-party credentials (all optional until you set them — see README) --

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
GOOGLE_OAUTH_CLIENT_ID = os.environ.get("GOOGLE_OAUTH_CLIENT_ID", "")
GOOGLE_OAUTH_CLIENT_SECRET = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET", "")
# Public base URL of this deployment, used to build the OAuth redirect_uri —
# e.g. https://your-app.vercel.app (no trailing slash). Falls back to
# localhost for local dev.
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "http://127.0.0.1:8000")
# The full contents of a Firebase service-account JSON key (see README), used
# server-side to verify Firebase ID tokens. Stored as one env var (not a
# file) so it works on serverless hosts like Vercel — never commit the
# actual key content anywhere.
FIREBASE_SERVICE_ACCOUNT_JSON = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
