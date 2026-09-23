"""
Chat WebSocket consumer - Handles real-time chat messaging
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat in whiteboard sessions
    """
    
    async def connect(self):
        """
        Called when WebSocket connection is established
        """
        self.session_code = self.scope['url_route']['kwargs']['session_code']
        self.room_group_name = f'chat_{self.session_code}'
        self.user = self.scope['user']
        
        print(f"💬 Chat WebSocket connection attempt for session: {self.session_code}, user: {self.user}")
        
        # Verify user is authenticated
        if not self.user.is_authenticated:
            print(f"❌ Chat: User not authenticated, closing connection")
            await self.close()
            return
        
        # Verify session exists and user has access
        has_access = await self.verify_session_access()
        if not has_access:
            print(f"❌ Chat: User {self.user} has no access to session {self.session_code}")
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        print(f"✅ Chat WebSocket connected successfully for user: {self.user.username} in session: {self.session_code}")
    
    async def disconnect(self, close_code):
        """
        Called when WebSocket connection is closed
        """
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
            
            print(f"💬 Received chat message from {self.user.username}: {data.get('content', '')[:50]}")
            
            if message_type == 'chat_message':
                # Save and broadcast chat message
                content = data.get('content', '').strip()
                if content:
                    message_id = await self.save_message(content)
                    
                    # Broadcast to room group
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'message_id': message_id,
                            'user_id': self.user.id,
                            'username': self.user.username,
                            'content': content,
                            'timestamp': await self.get_message_timestamp(message_id)
                        }
                    )
                    print(f"📤 Broadcasted chat message to group: {self.room_group_name}")
        
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON received in chat from {self.user.username}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    async def chat_message(self, event):
        """Send chat message to WebSocket"""
        await self.send(text_data=json.dumps(event))
    
    # Database operations
    
    @database_sync_to_async
    def verify_session_access(self):
        """Verify that session exists and user has access"""
        from whiteboard.models import Session, Participant
        try:
            session = Session.objects.get(code=self.session_code, is_active=True)
            # Check if user is creator or participant
            is_creator = session.creator == self.user
            is_participant = Participant.objects.filter(session=session, user=self.user).exists()
            return is_creator or is_participant
        except ObjectDoesNotExist:
            return False
    
    @database_sync_to_async
    def save_message(self, content):
        """Save message to database"""
        from whiteboard.models import Session
        from .models import Message
        session = Session.objects.get(code=self.session_code)
        message = Message.objects.create(
            session=session,
            user=self.user,
            content=content
        )
        return message.id
    
    @database_sync_to_async
    def get_message_timestamp(self, message_id):
        """Get message timestamp"""
        from .models import Message
        message = Message.objects.get(id=message_id)
        return message.created_at.isoformat()
