"""
Whiteboard WebSocket routing
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/whiteboard/(?P<session_code>\w+)/$', consumers.WhiteboardConsumer.as_asgi()),
]
