# backend/core/urls.py
from . import views

from django.urls import path
from .views import register_user,login_user
urlpatterns = [
    path("register/", register_user, name="register"),
        path("login/", views.login_user, name="login"),
        ]
