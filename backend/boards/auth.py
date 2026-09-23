# backend/boards/auth.py
import urllib.parse
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from channels.db import database_sync_to_async

auth = JWTAuthentication()

@database_sync_to_async
def get_user_from_scope(scope):
    query_string = scope.get("query_string", b"").decode()
    params = urllib.parse.parse_qs(query_string)
    token = params.get("token", [None])[0]
    if not token:
        return AnonymousUser()
    # validate token
    validated = auth.get_validated_token(token)
    user = auth.get_user(validated)
    return user
