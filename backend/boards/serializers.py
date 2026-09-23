# boards/serializers.py
from rest_framework import serializers
from .models import Room, ChatMessage, Participant, BoardElement

class RoomSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    participants_count = serializers.IntegerField(source='participants.count', read_only=True)

    class Meta:
        model = Room
        fields = ["id", "name", "slug", "created_by", "created_by_username", "created_at", "is_locked", "is_chat_locked", "participants_count"]
        read_only_fields = ["created_by", "slug", "created_at", "participants_count"]

class ParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Participant
        fields = ["id", "user", "username", "room", "role", "can_draw", "can_chat", "joined_at"]

class BoardElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardElement
        fields = "__all__"

class ChatMessageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ChatMessage
        fields = ["id", "room", "user", "username", "content", "created_at"]
        read_only_fields = ["user", "created_at"]
