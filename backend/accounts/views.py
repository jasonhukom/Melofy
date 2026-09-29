import json
from datetime import timedelta

from django.http import HttpResponseRedirect, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from . import firebase, google_oauth, handoff, youtube_account
from .models import YouTubeAccount

# CSRF is exempted on these JSON endpoints because the real auth proof is a
# Firebase ID token or an existing session, and the session cookie is
# SameSite=Lax (see settings.py) — a reasonable trade-off for a same-origin,
# hand-rolled API. For a public production deployment, proper per-request
# CSRF tokens would be a worthwhile hardening step.


def _account_status(uid):
    connected = YouTubeAccount.objects.filter(firebase_uid=uid).exists()
    return connected


@csrf_exempt
@require_POST
def session_login(request):
    """Web (and, indirectly, Android) sign-in: the frontend already
    completed Firebase's Google sign-in and hands us the resulting ID token;
    we verify it and start a Django session."""
    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    id_token = body.get("idToken", "")
    if not id_token:
        return JsonResponse({"error": "Missing idToken"}, status=400)

    try:
        decoded = firebase.verify_id_token(id_token)
    except RuntimeError as exc:
        return JsonResponse({"error": str(exc)}, status=503)
    except Exception:
        return JsonResponse({"error": "Invalid or expired sign-in token"}, status=401)

    request.session["firebase_uid"] = decoded["uid"]
    request.session["email"] = decoded.get("email", "")
    request.session["display_name"] = decoded.get("name", "")

    return JsonResponse({
        "uid": decoded["uid"],
        "email": decoded.get("email", ""),
        "displayName": decoded.get("name", ""),
        "youtubeConnected": _account_status(decoded["uid"]),
    })


@csrf_exempt
@require_POST
def mobile_login_handoff(request):
    """Android only. The Custom Tab that completed Firebase sign-in calls
    this with the Firebase ID token (Chrome's cookie jar, not the app's
    WebView, so it can't just rely on a session existing). Returns a
    one-time code the app can redeem from inside its own WebView via the
    melofy://auth/complete deep link + /api/auth/exchange."""
    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    id_token = body.get("idToken", "")
    if not id_token:
        return JsonResponse({"error": "Missing idToken"}, status=400)

    try:
        decoded = firebase.verify_id_token(id_token)
    except RuntimeError as exc:
        return JsonResponse({"error": str(exc)}, status=503)
    except Exception:
        return JsonResponse({"error": "Invalid or expired sign-in token"}, status=401)

    code = handoff.mint(
        decoded["uid"], platform="android", purpose="login_handoff",
        email=decoded.get("email", ""), display_name=decoded.get("name", ""),
    )
    return JsonResponse({"code": code})


@require_GET
def session_exchange(request):
    """Called from inside the Android WebView after the melofy://auth/complete
    deep link fires, to establish a real session cookie in the WebView's own
    storage (Custom Tabs and the WebView don't share cookies)."""
    resolved = handoff.resolve(request.GET.get("code", ""), purpose="login_handoff")
    if not resolved:
        return JsonResponse({"error": "Invalid or expired code"}, status=400)

    uid = resolved["firebase_uid"]
    request.session["firebase_uid"] = uid
    request.session["email"] = resolved["email"]
    request.session["display_name"] = resolved["display_name"]

    return JsonResponse({
        "uid": uid,
        "email": resolved["email"],
        "displayName": resolved["display_name"],
        "youtubeConnected": _account_status(uid),
    })


@csrf_exempt
@require_POST
def session_logout(request):
    request.session.flush()
    return JsonResponse({"ok": True})


@require_GET
def session_me(request):
    uid = request.session.get("firebase_uid")
    if not uid:
        return JsonResponse({"signedIn": False})
    return JsonResponse({
        "signedIn": True,
        "uid": uid,
        "email": request.session.get("email", ""),
        "displayName": request.session.get("display_name", ""),
        "youtubeConnected": _account_status(uid),
    })


@require_GET
def youtube_connect(request):
    uid = request.session.get("firebase_uid")
    if not uid:
        return JsonResponse({"error": "Sign in first"}, status=401)
    platform = request.GET.get("platform", "web")
    state_token = handoff.mint(uid, platform=platform, purpose="youtube_connect")
    return HttpResponseRedirect(google_oauth.build_auth_url(state_token))


@require_GET
def youtube_callback(request):
    if request.GET.get("error"):
        return HttpResponseRedirect("/#/library?youtube=error")

    resolved = handoff.resolve(request.GET.get("state", ""), purpose="youtube_connect")
    if not resolved:
        return JsonResponse({"error": "Invalid or expired OAuth state"}, status=400)
    uid, platform = resolved["firebase_uid"], resolved["platform"]

    code = request.GET.get("code", "")
    if not code:
        return HttpResponseRedirect("/#/library?youtube=error")

    try:
        token_data = google_oauth.exchange_code(code)
    except Exception:
        return HttpResponseRedirect("/#/library?youtube=error")

    refresh_token = token_data.get("refresh_token", "")
    account, _ = YouTubeAccount.objects.get_or_create(firebase_uid=uid)
    account.email = request.session.get("email", "") or account.email
    account.display_name = request.session.get("display_name", "") or account.display_name
    if refresh_token:  # Google only sends this the first time a user consents
        account.refresh_token = refresh_token
    account.access_token = token_data.get("access_token", "")
    account.token_expiry = timezone.now() + timedelta(seconds=token_data.get("expires_in", 3600))

    if not account.refresh_token:
        # No refresh token now and none stored before — shouldn't normally
        # happen since we always pass prompt=consent, but bail out cleanly.
        return HttpResponseRedirect("/#/library?youtube=error")

    account.save()

    if platform == "android":
        handoff_code = handoff.mint(uid, platform="android", purpose="login_handoff")
        return HttpResponseRedirect(f"melofy://auth/complete?code={handoff_code}")
    return HttpResponseRedirect("/#/library?youtube=connected")


@csrf_exempt
@require_POST
def youtube_disconnect(request):
    uid = request.session.get("firebase_uid")
    if not uid:
        return JsonResponse({"error": "Sign in first"}, status=401)
    YouTubeAccount.objects.filter(firebase_uid=uid).delete()
    return JsonResponse({"ok": True})


def _require_connected_account(request):
    uid = request.session.get("firebase_uid")
    if not uid:
        return None, JsonResponse({"error": "Sign in first"}, status=401)
    try:
        return YouTubeAccount.objects.get(firebase_uid=uid), None
    except YouTubeAccount.DoesNotExist:
        return None, JsonResponse({"error": "YouTube account not connected"}, status=409)


@require_GET
def youtube_liked(request):
    account, err = _require_connected_account(request)
    if err:
        return err
    try:
        token = youtube_account.get_valid_access_token(account)
        songs = youtube_account.fetch_liked_videos(token)
    except Exception:
        return JsonResponse({"error": "Could not fetch liked videos from YouTube"}, status=502)
    return JsonResponse({"results": songs})


@require_GET
def youtube_subscriptions(request):
    account, err = _require_connected_account(request)
    if err:
        return err
    try:
        token = youtube_account.get_valid_access_token(account)
        channels = youtube_account.fetch_subscriptions(token)
    except Exception:
        return JsonResponse({"error": "Could not fetch subscriptions from YouTube"}, status=502)
    return JsonResponse({"results": channels})


@require_GET
def youtube_playlists(request):
    account, err = _require_connected_account(request)
    if err:
        return err
    try:
        token = youtube_account.get_valid_access_token(account)
        playlists = youtube_account.fetch_playlists(token)
    except Exception:
        return JsonResponse({"error": "Could not fetch playlists from YouTube"}, status=502)
    return JsonResponse({"results": playlists})
