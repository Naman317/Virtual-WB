from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify
import uuid

User = get_user_model()

class Room(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Global permissions
    is_locked = models.BooleanField(default=False)
    is_chat_locked = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or "room"
            self.slug = f"{base}-{uuid.uuid4().hex[:6]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.slug})"

class BoardElement(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="elements")
    element_id = models.CharField(max_length=100) # Client-side ID
    type = models.CharField(max_length=50)
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        ordering = ['created_at']

class Participant(models.Model):
    ROLE_CHOICES = (("teacher", "Teacher"), ("student", "Student"))
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="participants")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    
    # Individual permissions
    can_draw = models.BooleanField(default=False)
    can_chat = models.BooleanField(default=False)
    
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "room")
    
    def __str__(self):
        return f"{self.user.username} ({self.role}) → {self.room.name}"

class ChatMessage(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="messages")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}: {self.content[:30]}"