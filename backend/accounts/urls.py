from django.urls import path

from . import views

urlpatterns = [
    path("auth/session", views.session_login, name="session_login"),
    path("auth/mobile-handoff", views.mobile_login_handoff, name="mobile_login_handoff"),
    path("auth/exchange", views.session_exchange, name="session_exchange"),
    path("auth/logout", views.session_logout, name="session_logout"),
    path("auth/me", views.session_me, name="session_me"),
    path("youtube/connect", views.youtube_connect, name="youtube_connect"),
    path("youtube/callback", views.youtube_callback, name="youtube_callback"),
    path("youtube/disconnect", views.youtube_disconnect, name="youtube_disconnect"),
    path("youtube/liked", views.youtube_liked, name="youtube_liked"),
    path("youtube/subscriptions", views.youtube_subscriptions, name="youtube_subscriptions"),
    path("youtube/playlists", views.youtube_playlists, name="youtube_playlists"),
]
