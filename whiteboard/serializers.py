"""
Whiteboard app serializers - REST API serialization
"""
from rest_framework import serializers
from .models import Session, Stroke, Participant
from users.models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user info"""
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'role']


class ParticipantSerializer(serializers.ModelSerializer):
    """Serializer for session participants"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Participant
        fields = ['id', 'user', 'joined_at', 'is_online', 'hand_raised']


class SessionSerializer(serializers.ModelSerializer):
    """Serializer for whiteboard sessions"""
    creator = UserSerializer(read_only=True)
    participants = ParticipantSerializer(many=True, read_only=True)
    participants_count = serializers.IntegerField(source='get_participants_count', read_only=True)
    
    class Meta:
        model = Session
        fields = [
            'id', 'name', 'code', 'creator', 'created_at', 'updated_at',
            'is_active', 'snapshot', 'participants', 'participants_count'
        ]
        read_only_fields = ['code', 'creator', 'created_at', 'updated_at']


class StrokeSerializer(serializers.ModelSerializer):
    """Serializer for whiteboard strokes"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Stroke
        fields = ['id', 'session', 'user', 'tool', 'data', 'created_at', 'order']
        read_only_fields = ['user', 'created_at', 'order']
