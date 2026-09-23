from rest_framework import viewsets, permissions, status
from django.db import models
from .models import Room, ChatMessage, Participant, BoardElement
from .serializers import RoomSerializer, ChatMessageSerializer, ParticipantSerializer
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by("-created_at")
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", "student") # Note: assuming role is handled by Participant model now

        # Logic to return rooms based on participation
        return Room.objects.filter(
            models.Q(created_by=user) | models.Q(participants__user=user)
        ).distinct()

    def perform_create(self, serializer):
        room = serializer.save(created_by=self.request.user)
        # Creator is automatically a teacher
        Participant.objects.create(user=self.request.user, room=room, role="teacher", can_draw=True, can_chat=True)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_room_by_code(request):
    code = request.data.get('code')
    if not code:
        return Response({'error': 'Room code required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        room = Room.objects.get(slug=code)
    except Room.DoesNotExist:
        return Response({'error': 'Invalid code'}, status=status.HTTP_404_NOT_FOUND)

    participant, created = Participant.objects.get_or_create(
        user=request.user, 
        room=room, 
        defaults={'role': 'student', 'can_draw': False, 'can_chat': False}
    )
    return Response({'message': 'Joined successfully!'}, status=status.HTTP_200_OK)

class ChatViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all().order_by("created_at")
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get("room")
        qs = ChatMessage.objects.all().order_by("created_at")
        if room_id:
            qs = qs.filter(room__id=room_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)