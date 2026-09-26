from django.contrib import admin
from django.urls import include, path

from core.views import spa_shell

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("api/", include("accounts.urls")),
    path("", spa_shell),  # everything else is the single-page app shell
]
