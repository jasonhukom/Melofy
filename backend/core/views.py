import json

from django.http import HttpResponseServerError, JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET

from . import youtube


def spa_shell(request):
    """Serves the single-page app shell for every non-API route. Client-side
    hash routing (see js/router.js) handles what's actually shown."""
    return render(request, "index.html")


@require_GET
def search_view(request):
    query = request.GET.get("q", "").strip()
    if not query:
        return JsonResponse({"error": "Missing q parameter"}, status=400)
    try:
        songs = youtube.search(query)
    except RuntimeError as exc:
        return JsonResponse({"error": str(exc)}, status=503)
    except Exception:
        return JsonResponse({"error": "Search failed — check the server's YouTube API key and quota."}, status=502)
    return JsonResponse({"query": query, "results": songs})


@require_GET
def random_view(request):
    try:
        seed, songs = youtube.random_picks()
    except RuntimeError as exc:
        return JsonResponse({"error": str(exc)}, status=503)
    except Exception:
        return JsonResponse({"error": "Could not fetch picks right now."}, status=502)
    return JsonResponse({"seed": seed, "results": songs})
