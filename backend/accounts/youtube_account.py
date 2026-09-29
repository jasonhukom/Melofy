"""Calls the YouTube Data API v3 on behalf of a signed-in, YouTube-connected
user (their liked videos, subscriptions, playlists) using the OAuth access
token stored on their YouTubeAccount row, refreshing it first if needed."""
from datetime import timedelta

import requests
from django.utils import timezone

from . import google_oauth

API_BASE = "https://www.googleapis.com/youtube/v3"


def get_valid_access_token(account):
    still_valid = (
        account.access_token
        and account.token_expiry
        and account.token_expiry > timezone.now() + timedelta(seconds=60)
    )
    if still_valid:
        return account.access_token

    token_data = google_oauth.refresh_access_token(account.refresh_token)
    account.access_token = token_data["access_token"]
    account.token_expiry = timezone.now() + timedelta(seconds=token_data.get("expires_in", 3600))
    account.save(update_fields=["access_token", "token_expiry", "updated_at"])
    return account.access_token


def _get(path, access_token, params):
    resp = requests.get(
        f"{API_BASE}/{path}",
        headers={"Authorization": f"Bearer {access_token}"},
        params=params,
        timeout=8,
    )
    resp.raise_for_status()
    return resp.json()


def _thumb(snippet):
    thumbs = snippet.get("thumbnails", {})
    return (thumbs.get("medium") or thumbs.get("default") or {}).get("url", "")


def fetch_liked_videos(access_token, max_results=25):
    data = _get("videos", access_token, {
        "part": "snippet", "myRating": "like", "maxResults": max_results,
    })
    songs = []
    for item in data.get("items", []):
        snippet = item.get("snippet", {})
        songs.append({
            "id": item.get("id", ""),
            "title": snippet.get("title", ""),
            "artist": snippet.get("channelTitle", ""),
            "thumbnail": _thumb(snippet),
        })
    return songs


def fetch_subscriptions(access_token, max_results=25):
    data = _get("subscriptions", access_token, {
        "part": "snippet", "mine": "true", "maxResults": max_results, "order": "alphabetical",
    })
    channels = []
    for item in data.get("items", []):
        snippet = item.get("snippet", {})
        channels.append({
            "channelId": snippet.get("resourceId", {}).get("channelId", ""),
            "title": snippet.get("title", ""),
            "thumbnail": _thumb(snippet),
        })
    return channels


def fetch_playlists(access_token, max_results=25):
    data = _get("playlists", access_token, {
        "part": "snippet,contentDetails", "mine": "true", "maxResults": max_results,
    })
    playlists = []
    for item in data.get("items", []):
        snippet = item.get("snippet", {})
        playlists.append({
            "id": item.get("id", ""),
            "title": snippet.get("title", ""),
            "itemCount": item.get("contentDetails", {}).get("itemCount", 0),
            "thumbnail": _thumb(snippet),
        })
    return playlists
