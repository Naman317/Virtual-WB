"""
Chat app admin configuration
"""
from django.contrib import admin
from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Admin interface for Message model"""
    list_display = ['user', 'session', 'content_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'session__name', 'session__code', 'content']
    readonly_fields = ['created_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'

