"""
Whiteboard app views - Session management and whiteboard interface
"""
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.core.files.base import ContentFile
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
import base64
import json
from .models import Session, Stroke, Participant
from .serializers import SessionSerializer, StrokeSerializer


@login_required
def create_session_view(request):
    """
    Teacher creates a new whiteboard session
    """
    if not request.user.is_teacher():
        messages.error(request, 'Only teachers can create sessions.')
        return redirect('dashboard')
    
    if request.method == 'POST':
        name = request.POST.get('name')
        if name:
            session = Session.objects.create(name=name, creator=request.user)
            # Add creator as participant
            Participant.objects.create(session=session, user=request.user)
            messages.success(request, f'Session "{name}" created! Code: {session.code}')
            return redirect('whiteboard_room', code=session.code)
    
    return render(request, 'whiteboard/create_session.html')


@login_required
def join_session_view(request):
    """
    Student joins an existing session using code
    """
    if request.method == 'POST':
        code = request.POST.get('code', '').upper()
        try:
            session = Session.objects.get(code=code, is_active=True)
            # Add user as participant if not already
            Participant.objects.get_or_create(
                session=session,
                user=request.user,
                defaults={'is_online': True}
            )
            return redirect('whiteboard_room', code=code)
        except Session.DoesNotExist:
            messages.error(request, 'Invalid session code or session is inactive.')
    
    return render(request, 'whiteboard/join_session.html')


@login_required
def whiteboard_room_view(request, code):
    """
    Main whiteboard room interface
    """
    session = get_object_or_404(Session, code=code, is_active=True)
    
    # Check if user is participant or creator
    is_participant = Participant.objects.filter(session=session, user=request.user).exists()
    is_creator = session.creator == request.user
    
    if not (is_participant or is_creator):
        messages.error(request, 'You are not a participant in this session.')
        return redirect('dashboard')
    
    # Get or create participant record
    participant, created = Participant.objects.get_or_create(
        session=session,
        user=request.user,
        defaults={'is_online': True}
    )
    if not created:
        participant.is_online = True
        participant.save()
    
    # Get all participants
    participants = Participant.objects.filter(session=session, is_online=True).select_related('user')
    
    context = {
        'session': session,
        'is_creator': is_creator,
        'participants': participants,
        'user_role': request.user.role,
    }
    
    return render(request, 'whiteboard/room.html', context)


@login_required
def my_sessions_view(request):
    """
    View all sessions for current user
    """
    if request.user.is_teacher():
        sessions = Session.objects.filter(creator=request.user)
    else:
        sessions = Session.objects.filter(participants__user=request.user).distinct()
    
    context = {'sessions': sessions}
    return render(request, 'whiteboard/my_sessions.html', context)


@login_required
@require_http_methods(["POST"])
def save_snapshot_view(request, code):
    """
    Save whiteboard as PNG image
    """
    session = get_object_or_404(Session, code=code)
    
    # Check permissions
    if session.creator != request.user:
        return JsonResponse({'error': 'Only session creator can save snapshots'}, status=403)
    
    try:
        # Get base64 image data from request
        data = json.loads(request.body)
        image_data = data.get('image')
        
        if image_data:
            # Remove data URL prefix
            format, imgstr = image_data.split(';base64,')
            ext = format.split('/')[-1]
            
            # Save image
            image_file = ContentFile(base64.b64decode(imgstr), name=f'{session.code}_snapshot.{ext}')
            session.snapshot = image_file
            session.save()
            
            return JsonResponse({'message': 'Snapshot saved successfully'})
        
        return JsonResponse({'error': 'No image data provided'}, status=400)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def end_session_view(request, code):
    """
    Teacher ends a session
    """
    session = get_object_or_404(Session, code=code)
    
    if session.creator != request.user:
        return JsonResponse({'error': 'Only session creator can end the session'}, status=403)
    
    session.is_active = False
    session.save()
    
    return JsonResponse({'message': 'Session ended'})


# REST API ViewSets
class SessionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for sessions
    """
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return sessions for current user"""
        user = self.request.user
        if user.is_teacher():
            return Session.objects.filter(creator=user)
        return Session.objects.filter(participants__user=user).distinct()
    
    @action(detail=True, methods=['get'])
    def replay(self, request, pk=None):
        """
        Get all strokes for session replay
        """
        session = self.get_object()
        strokes = session.strokes.all().order_by('order', 'created_at')
        serializer = StrokeSerializer(strokes, many=True)
        return Response({
            'session': SessionSerializer(session).data,
            'strokes': serializer.data
        })


class StrokeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for strokes (read-only, strokes are created via WebSocket)
    """
    serializer_class = StrokeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return strokes for sessions user has access to"""
        user = self.request.user
        if user.is_teacher():
            session_ids = Session.objects.filter(creator=user).values_list('id', flat=True)
        else:
            session_ids = Session.objects.filter(participants__user=user).values_list('id', flat=True)
        
        return Stroke.objects.filter(session_id__in=session_ids)

