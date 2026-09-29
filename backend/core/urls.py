from django.urls import path

from . import views

urlpatterns = [
    path("search", views.search_view, name="search"),
    path("random", views.random_view, name="random"),
]
