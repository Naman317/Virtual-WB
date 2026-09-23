"""
Whiteboard app models - Sessions, Strokes, and Participants
"""
from django.db import models
from django.conf import settings
from django.utils.crypto import get_random_string
import json


def generate_session_code():
    """Generate a unique 6-character session code"""
    return get_random_string(6, allowed_chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')


class Session(models.Model):
    """
    Whiteboard session model - represents a collaborative whiteboard room
    """
    name = models.CharField(max_length=200, help_text="Session name/title")
    code = models.CharField(
        max_length=6,
        unique=True,
        default=generate_session_code,
        help_text="Unique join code for students"
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_sessions',
        help_text="Teacher who created this session"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the session is currently active"
    )
    snapshot = models.ImageField(
        upload_to='session_snapshots/',
        null=True,
        blank=True,
        help_text="Saved snapshot of the whiteboard"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Whiteboard Session'
        verbose_name_plural = 'Whiteboard Sessions'
    
    def __str__(self):
        return f"{self.name} ({self.code})"
    
    def get_participants_count(self):
        """Get the number of participants in this session"""
        return self.participants.count()


class Participant(models.Model):
    """
    Tracks users who have joined a session
    """
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name='participants'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='joined_sessions'
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    is_online = models.BooleanField(default=True)
    hand_raised = models.BooleanField(
        default=False,
        help_text="Student has raised hand for teacher attention"
    )
    
    class Meta:
        unique_together = ['session', 'user']
        ordering = ['joined_at']
    
    def __str__(self):
        return f"{self.user.username} in {self.session.name}"


class Stroke(models.Model):
    """
    Individual drawing stroke/action on the whiteboard
    Stores all drawing data as JSON for replay functionality
    """
    TOOL_CHOICES = [
        ('pen', 'Pen'),
        ('eraser', 'Eraser'),
        ('rectangle', 'Rectangle'),
        ('circle', 'Circle'),
        ('arrow', 'Arrow'),
        ('text', 'Text'),
    ]
    
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name='strokes'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='strokes'
    )
    tool = models.CharField(max_length=20, choices=TOOL_CHOICES)
    data = models.JSONField(
        help_text="Stroke data: {points: [[x,y]...], color: '#000', width: 2, text: 'abc'}"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    order = models.IntegerField(
        default=0,
        help_text="Order of stroke for replay (auto-incremented)"
    )
    
    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = 'Stroke'
        verbose_name_plural = 'Strokes'
    
    def __str__(self):
        return f"{self.tool} by {self.user.username} at {self.created_at}"
    
    def save(self, *args, **kwargs):
        """Auto-increment order for new strokes"""
        if not self.pk:
            last_stroke = Stroke.objects.filter(session=self.session).order_by('-order').first()
            self.order = (last_stroke.order + 1) if last_stroke else 0
        super().save(*args, **kwargs)

