# backend/boards/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Room, ChatMessage, Participant, BoardElement
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone
from .serializers import BoardElementSerializer

try:
    from .auth import get_user_from_scope
    HAVE_JWT_HELPER = True
except Exception:
    HAVE_JWT_HELPER = False

class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_slug = self.scope["url_route"]["kwargs"]["room_slug"]
        self.group_name = f"room_{self.room_slug}"

        if HAVE_JWT_HELPER:
            user = await get_user_from_scope(self.scope)
            self.scope["user"] = user

        self.user = self.scope.get("user") if self.scope.get("user") else AnonymousUser()
        
        # Verify room exists
        room = await self.get_room(self.room_slug)
        if not room:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # 1. Send current board state to the new joiner
        elements = await self.get_board_elements(self.room_slug)
        await self.send(json.dumps({
            "type": "init_state",
            "payload": {
                "elements": elements,
                "room": {
                    "is_locked": room.is_locked,
                    "is_chat_locked": room.is_chat_locked
                }
            }
        }))

        # 2. Broadcast presence
        await self.channel_layer.group_send(self.group_name, {
            "type": "broadcast",
            "message": {
                "type": "presence", 
                "action": "join", 
                "user": self.user.username if self.user.is_authenticated else "anon", 
                "ts": timezone.now().isoformat()
            }
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await self.channel_layer.group_send(self.group_name, {
            "type": "broadcast",
            "message": {
                "type": "presence", 
                "action": "leave", 
                "user": self.user.username if self.user.is_authenticated else "anon", 
                "ts": timezone.now().isoformat()
            }
        })

    async def receive(self, text_data=None, bytes_data=None):
        if text_data is None: return
        try:
            data = json.loads(text_data)
        except Exception: return

        msg_type = data.get("type")
        payload = data.get("payload", {})
        sender_name = self.user.username if self.user.is_authenticated else "anon"
        
        # Security: Check permissions for drawing/chatting
        if msg_type == "draw_sync":
            allowed = await self.can_user_do(self.user, self.room_slug, "draw")
            if not allowed: return
            # Save element to DB for persistence
            await self.save_element(self.room_slug, self.user, payload)

        elif msg_type == "chat":
            allowed = await self.can_user_do(self.user, self.room_slug, "chat")
            if not allowed: return
            await self.save_chat(self.room_slug, self.user, payload.get("message"))

        elif msg_type == "permission_request":
            # Broadcast request to teacher(s)
            await self.channel_layer.group_send(self.group_name, {
                "type": "broadcast",
                "message": {
                    "type": "permission_request",
                    "payload": { "user": sender_name, "request": payload.get("request") },
                    "sender": sender_name
                }
            })
            return

        elif msg_type == "control":
            is_teacher = await self.is_user_teacher(self.user, self.room_slug)
            if not is_teacher: return
            
            action = payload.get("action")
            if action == "grant_permission":
                target_user = payload.get("target")
                perm_type = payload.get("perm_type") # "draw" or "chat"
                await self.grant_permission(self.room_slug, target_user, perm_type)
                
                await self.channel_layer.group_send(self.group_name, {
                    "type": "broadcast",
                    "message": {
                        "type": "permission_update",
                        "payload": { "user": target_user, "perm_type": perm_type, "allowed": True },
                        "sender": sender_name
                    }
                })
                return
            
            elif action == "clear":
                await self.clear_board(self.room_slug)
                # Broadcast the clear message normally below
                
            elif action == "lock_chat":
                await self.configure_chat_lock(self.room_slug, True)
                await self.channel_layer.group_send(self.group_name, {
                    "type": "broadcast",
                    "message": { "type": "chat_lock_update", "payload": { "locked": True }, "sender": sender_name }
                })
                return
            
            elif action == "unlock_chat":
                await self.configure_chat_lock(self.room_slug, False)
                await self.channel_layer.group_send(self.group_name, {
                    "type": "broadcast",
                    "message": { "type": "chat_lock_update", "payload": { "locked": False }, "sender": sender_name }
                })
                return

        elif msg_type == "element_delete":
            allowed = await self.can_user_do(self.user, self.room_slug, "draw")
            if not allowed: return
            element_id = payload.get("id")
            if element_id:
                is_teacher = await self.is_user_teacher(self.user, self.room_slug)
                if not is_teacher and not str(element_id).startswith(self.user.username + "-"):
                    return
                await self.delete_element(self.room_slug, element_id)

        # Default broadcast
        await self.channel_layer.group_send(self.group_name, {
            "type": "broadcast",
            "message": {
                "type": msg_type,
                "payload": payload,
                "sender": sender_name,
                "ts": timezone.now().isoformat()
            }
        })

    async def broadcast(self, event):
        await self.send(text_data=json.dumps(event["message"]))

    @database_sync_to_async
    def get_room(self, slug):
        try:
            return Room.objects.get(slug=slug)
        except Room.DoesNotExist:
            return None

    @database_sync_to_async
    def get_board_elements(self, slug):
        elements = BoardElement.objects.filter(room__slug=slug)
        return BoardElementSerializer(elements, many=True).data

    @database_sync_to_async
    def can_user_do(self, user, room_slug, action):
        if not user.is_authenticated: return False
        room = Room.objects.get(slug=room_slug)
        if room.created_by == user: return True # Teacher always allowed
        
        try:
            p = Participant.objects.get(user=user, room=room)
            if action == "draw": return p.can_draw or not room.is_locked
            if action == "chat": return p.can_chat or not room.is_chat_locked
        except Participant.DoesNotExist:
            pass
        return False

    @database_sync_to_async
    def is_user_teacher(self, user, room_slug):
        if not user.is_authenticated: return False
        return Room.objects.filter(slug=room_slug, created_by=user).exists() or \
               Participant.objects.filter(user=user, room__slug=room_slug, role="teacher").exists()

    @database_sync_to_async
    def save_element(self, room_slug, user, payload):
        room = Room.objects.get(slug=room_slug)
        element_id = payload.get("id")
        # Upsert element
        BoardElement.objects.update_or_create(
            room=room, element_id=element_id,
            defaults={
                "type": payload.get("type"),
                "data": payload,
                "created_by": user
            }
        )

    @database_sync_to_async
    def clear_board(self, room_slug):
        BoardElement.objects.filter(room__slug=room_slug).delete()

    @database_sync_to_async
    def grant_permission(self, room_slug, target_username, perm_type):
        try:
            room = Room.objects.get(slug=room_slug)
            participant = Participant.objects.get(user__username=target_username, room=room)
            if perm_type == "draw":
                participant.can_draw = True
            elif perm_type == "chat":
                participant.can_chat = True
            participant.save()
        except Exception as e:
            print(f"Error granting permission: {e}")

    @database_sync_to_async
    def configure_chat_lock(self, room_slug, is_locked):
        room = Room.objects.get(slug=room_slug)
        room.is_chat_locked = is_locked
        room.save()

    @database_sync_to_async
    def save_chat(self, room_slug, user, content):
        room = Room.objects.get(slug=room_slug)
        ChatMessage.objects.create(room=room, user=user, content=content)

    @database_sync_to_async
    def delete_element(self, room_slug, element_id):
        BoardElement.objects.filter(room__slug=room_slug, element_id=element_id).delete()
