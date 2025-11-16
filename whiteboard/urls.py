"""
Whiteboard app URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# API router
router = DefaultRouter()
router.register(r'api/sessions', views.SessionViewSet, basename='session')
router.register(r'api/strokes', views.StrokeViewSet, basename='stroke')

urlpatterns = [
    # Web views
    path('create/', views.create_session_view, name='create_session'),
    path('join/', views.join_session_view, name='join_session'),
    path('room/<str:code>/', views.whiteboard_room_view, name='whiteboard_room'),
    path('my-sessions/', views.my_sessions_view, name='my_sessions'),
    path('save-snapshot/<str:code>/', views.save_snapshot_view, name='save_snapshot'),
    path('end-session/<str:code>/', views.end_session_view, name='end_session'),
    
    # API endpoints
    path('', include(router.urls)),
]
