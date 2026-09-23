"""
Users app models - Custom user with role-based access control
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """
    Custom user model with role field for Teacher/Student distinction
    """
    ROLE_CHOICES = [
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    ]
    
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='student',
        help_text="User role: Teacher can create sessions, Student can join"
    )
    
    email = models.EmailField(unique=True)
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    def is_teacher(self):
        """Check if user is a teacher"""
        return self.role == 'teacher'
    
    def is_student(self):
        """Check if user is a student"""
        return self.role == 'student'

