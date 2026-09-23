from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, ChatViewSet, join_room_by_code

router = DefaultRouter()
router.register(r"rooms", RoomViewSet, basename="rooms")
router.register(r"chat", ChatViewSet, basename="chat")

urlpatterns = [
    path("rooms/join-by-code/", join_room_by_code, name="join-room-by-code"), 
    path("", include(router.urls)),
]
