# backend/boards/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/room/(?P<room_slug>[^/]+)/$", consumers.RoomConsumer.as_asgi()),
]
