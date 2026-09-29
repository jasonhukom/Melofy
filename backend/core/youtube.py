"""Small helper around the public YouTube Data API v3 endpoints that don't
need a signed-in user (search, videos). Uses the server-side API key from
settings — the key never reaches the browser."""
import random

import requests
from django.conf import settings

SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"

# Rotating seed queries for the homepage's "random" picks, since YouTube's
# search API has no literal "surprise me" endpoint.
RANDOM_SEED_QUERIES = [
    "pop hits", "hip hop", "rock anthems", "electronic dance",
    "chill lofi beats", "r&b soul", "indie music", "k-pop",
    "jazz standards", "classical piano", "acoustic guitar", "reggae",
    "latin music", "afrobeats", "synthwave", "folk music",
]


def _normalize(items):
    songs = []
    for item in items or []:
        video_id = item.get("id", {}).get("videoId")
        snippet = item.get("snippet", {})
        if not video_id:
            continue
        thumbs = snippet.get("thumbnails", {})
        thumb = (thumbs.get("medium") or thumbs.get("default") or {}).get("url", "")
        songs.append({
            "id": video_id,
            "title": snippet.get("title", ""),
            "artist": snippet.get("channelTitle", ""),
            "thumbnail": thumb,
        })
    return songs


def search(query, max_results=20):
    if not settings.YOUTUBE_API_KEY:
        raise RuntimeError("YOUTUBE_API_KEY is not configured on the server")
    params = {
        "part": "snippet",
        "type": "video",
        "maxResults": max_results,
        "videoCategoryId": "10",
        "q": query,
        "key": settings.YOUTUBE_API_KEY,
    }
    resp = requests.get(SEARCH_URL, params=params, timeout=8)
    resp.raise_for_status()
    return _normalize(resp.json().get("items"))


def random_picks(max_results=20):
    query = random.choice(RANDOM_SEED_QUERIES)
    return random.choice(RANDOM_SEED_QUERIES), search(query, max_results=max_results)
