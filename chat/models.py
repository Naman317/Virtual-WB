"""
Chat app models - Message storage for session chat
"""
from django.db import models
from django.conf import settings
from whiteboard.models import Session


class Message(models.Model):
    """
    Chat message model - stores messages in whiteboard sessions
    """
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_messages'
    )
    content = models.TextField(help_text="Message content")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name = 'Chat Message'
        verbose_name_plural = 'Chat Messages'
    
    def __str__(self):
        return f"{self.user.username}: {self.content[:50]}"

