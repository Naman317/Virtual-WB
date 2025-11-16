"""
Whiteboard app admin configuration
"""
from django.contrib import admin
from .models import Session, Participant, Stroke


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    """Admin interface for Session model"""
    list_display = ['name', 'code', 'creator', 'created_at', 'is_active', 'get_participants_count']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'code', 'creator__username']
    readonly_fields = ['code', 'created_at', 'updated_at']
    
    def get_participants_count(self, obj):
        return obj.get_participants_count()
    get_participants_count.short_description = 'Participants'


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    """Admin interface for Participant model"""
    list_display = ['user', 'session', 'joined_at', 'is_online', 'hand_raised']
    list_filter = ['is_online', 'hand_raised', 'joined_at']
    search_fields = ['user__username', 'session__name', 'session__code']


@admin.register(Stroke)
class StrokeAdmin(admin.ModelAdmin):
    """Admin interface for Stroke model"""
    list_display = ['id', 'session', 'user', 'tool', 'order', 'created_at']
    list_filter = ['tool', 'created_at']
    search_fields = ['session__name', 'session__code', 'user__username']
    readonly_fields = ['created_at', 'order']

