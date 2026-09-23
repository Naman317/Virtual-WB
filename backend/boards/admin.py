from django.contrib import admin
from .models import Room, Participant, ChatMessage, BoardElement

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_by", "created_at")
    search_fields = ("name", "slug")

@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ("user", "room", "role", "can_draw", "can_chat")
    list_filter = ("role", "can_draw", "can_chat")

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("user", "room", "content", "created_at")

@admin.register(BoardElement)
class BoardElementAdmin(admin.ModelAdmin):
    list_display = ("element_id", "room", "type", "created_by", "created_at")
