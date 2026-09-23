from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import MyTokenObtainPairView  # ✅ your custom JWT view

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/boards/", include("boards.urls")),
    path("api/core/", include("core.urls")),
    path("api/token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),  # ✅ custom one
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
