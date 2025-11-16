"""
Whiteboard WebSocket consumer - Handles real-time drawing synchronization
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist


class WhiteboardConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time whiteboard collaboration
    Handles drawing strokes, undo/redo, clear board, and participant updates
    """
    
    async def connect(self):
        """
        Called when WebSocket connection is established
        """
        self.session_code = self.scope['url_route']['kwargs']['session_code']
        self.room_group_name = f'whiteboard_{self.session_code}'
        self.user = self.scope['user']
        
        print(f"🔌 WebSocket connection attempt for session: {self.session_code}, user: {self.user}")
        
        # Verify user is authenticated
        if not self.user.is_authenticated:
            print(f"❌ User not authenticated, closing connection")
            await self.close()
            return
        
        # Verify session exists and user has access
        has_access = await self.verify_session_access()
        if not has_access:
            print(f"❌ User {self.user} has no access to session {self.session_code}")
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        print(f"✅ WebSocket connected successfully for user: {self.user.username} in session: {self.session_code}")
        
        # Update participant status to online
        await self.update_participant_status(True)
        
        # Notify others that user joined
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_joined',
                'username': self.user.username,
                'user_id': self.user.id,
                'role': self.user.role
            }
        )
    
    async def disconnect(self, close_code):
        """
        Called when WebSocket connection is closed
        """
        # Update participant status to offline
        await self.update_participant_status(False)
        
        # Notify others that user left
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_left',
                'username': self.user.username,
                'user_id': self.user.id
            }
        )
        
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """
        Receive message from WebSocket
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            print(f"📨 Received message from {self.user.username}: {message_type}")
            
            if message_type == 'draw':
                # Drawing stroke - save and broadcast
                await self.handle_draw(data)
            
            elif message_type == 'undo':
                # Undo last stroke
                await self.handle_undo(data)
            
            elif message_type == 'redo':
                # Redo stroke
                await self.handle_redo(data)
            
            elif message_type == 'clear':
                # Clear entire board (teacher only)
                await self.handle_clear(data)
            
            elif message_type == 'hand_raised':
                # Student raised hand
                await self.handle_hand_raised(data)
            
            elif message_type == 'hand_lowered':
                # Student lowered hand
                await self.handle_hand_lowered(data)
        
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON received from {self.user.username}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    async def handle_draw(self, data):
        """
        Handle drawing stroke - save to database and broadcast
        """
        stroke_data = data.get('data')
        tool = data.get('tool')
        
        print(f"🎨 Handling draw from {self.user.username}, tool: {tool}")
        
        # Save stroke to database
        stroke_id = await self.save_stroke(tool, stroke_data)
        
        # Broadcast to all users in room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'draw_stroke',
                'stroke_id': stroke_id,
                'user_id': self.user.id,
                'username': self.user.username,
                'tool': tool,
                'data': stroke_data
            }
        )
        print(f"📤 Broadcasted draw stroke to group: {self.room_group_name}")
    
    async def handle_undo(self, data):
        """
        Handle undo - broadcast to all users
        """
        stroke_id = data.get('stroke_id')
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'undo_stroke',
                'stroke_id': stroke_id,
                'user_id': self.user.id
            }
        )
    
    async def handle_redo(self, data):
        """
        Handle redo - broadcast to all users
        """
        stroke_id = data.get('stroke_id')
        stroke_data = data.get('data')
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'redo_stroke',
                'stroke_id': stroke_id,
                'data': stroke_data,
                'user_id': self.user.id
            }
        )
    
    async def handle_clear(self, data):
        """
        Handle clear board - teacher only
        """
        if not self.user.is_teacher():
            return
        
        # Clear all strokes from database
        await self.clear_session_strokes()
        
        # Broadcast clear to all users
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'clear_board',
                'user_id': self.user.id
            }
        )
    
    async def handle_hand_raised(self, data):
        """
        Handle student raising hand
        """
        await self.set_hand_raised(True)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'hand_raised',
                'user_id': self.user.id,
                'username': self.user.username
            }
        )
    
    async def handle_hand_lowered(self, data):
        """
        Handle student lowering hand
        """
        await self.set_hand_raised(False)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'hand_lowered',
                'user_id': self.user.id,
                'username': self.user.username
            }
        )
    
    # Event handlers for group messages
    
    async def draw_stroke(self, event):
        """Send draw stroke to WebSocket"""
        await self.send(text_data=json.dumps(event))
    
    async def undo_stroke(self, event):
        """Send undo to WebSocket"""
        await self.send(text_data=json.dumps(event))
    
    async def redo_stroke(self, event):
        """Send redo to WebSocket"""
        await self.send(text_data=json.dumps(event))
    
    async def clear_board(self, event):
        """Send clear board to WebSocket"""
        await self.send(text_data=json.dumps(event))
    
    async def user_joined(self, event):
        """Send user joined notification to WebSocket"""
        await self.send(text_data=json.dumps(event))
    
    async def user_left(self, event):
        """Send user left notification to WebSocket"""
        await self.send(text_data=json.dumps(event))
    
    async def hand_raised(self, event):
        """Send hand raised notification to WebSocket"""
        await self.send(text_data=json.dumps(event))
    
    async def hand_lowered(self, event):
        """Send hand lowered notification to WebSocket"""
        await self.send(text_data=json.dumps(event))
    
    # Database operations
    
    @database_sync_to_async
    def verify_session_access(self):
        """Verify that session exists and user has access"""
        from .models import Session, Participant
        try:
            session = Session.objects.get(code=self.session_code, is_active=True)
            # Check if user is creator or participant
            is_creator = session.creator == self.user
            is_participant = Participant.objects.filter(session=session, user=self.user).exists()
            return is_creator or is_participant
        except ObjectDoesNotExist:
            return False
    
    @database_sync_to_async
    def save_stroke(self, tool, stroke_data):
        """Save stroke to database"""
        from .models import Session, Stroke
        session = Session.objects.get(code=self.session_code)
        stroke = Stroke.objects.create(
            session=session,
            user=self.user,
            tool=tool,
            data=stroke_data
        )
        return stroke.id
    
    @database_sync_to_async
    def clear_session_strokes(self):
        """Clear all strokes from session"""
        from .models import Session
        session = Session.objects.get(code=self.session_code)
        session.strokes.all().delete()
    
    @database_sync_to_async
    def update_participant_status(self, is_online):
        """Update participant online status"""
        from .models import Session, Participant
        try:
            session = Session.objects.get(code=self.session_code)
            participant = Participant.objects.get(session=session, user=self.user)
            participant.is_online = is_online
            participant.save()
        except ObjectDoesNotExist:
            pass
    
    @database_sync_to_async
    def set_hand_raised(self, raised):
        """Set hand raised status for participant"""
        from .models import Session, Participant
        try:
            session = Session.objects.get(code=self.session_code)
            participant = Participant.objects.get(session=session, user=self.user)
            participant.hand_raised = raised
            participant.save()
        except ObjectDoesNotExist:
            pass
