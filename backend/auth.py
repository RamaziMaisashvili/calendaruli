import hashlib
import hmac
import secrets
from urllib.parse import unquote
from datetime import datetime, timedelta
from fastapi import Request
from database import connect
import auth_settings as settings


def now_utc():
    return datetime.utcnow()


def hash_password(password):
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
    return "scrypt$" + salt.hex() + "$" + digest.hex()


def verify_password(password, stored):
    try:
        method, salt, expected = stored.split("$")
        if method != "scrypt":
            return False
        digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1)
        return hmac.compare_digest(digest.hex(), expected)
    except (ValueError, TypeError):
        return False


DUMMY_HASH = hash_password("dummy-not-a-real-password")


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def denied():
    return {"authenticated": False, "message": "ვერ გაიარა ავტორიზაცია"}


def accepted(token=None, remaining=900):
    result = {"authenticated": True, "message": "ავტორიზაცია წარმატებულია",
              "rotate_after_seconds": max(1, int(remaining)),
              "idle_timeout_seconds": settings.SESSION_IDLE_SECONDS}
    if token:
        result["token"] = token
    return result


def login_user(username, password):
    db = connect()
    try:
        with db.cursor() as cur:
            cur.execute("SELECT * FROM api_users WHERE username=%s FOR UPDATE", (username,))
            user = cur.fetchone()
            now = now_utc()
            locked = bool(user and user["locked_until"] and user["locked_until"] > now)
            valid = verify_password(password, user["password_hash"] if user else DUMMY_HASH)
            if not user or not valid or not user["is_active"] or locked:
                if user and not locked:
                    failures = user["failed_attempts"] + 1
                    until = now + timedelta(minutes=15) if failures >= 5 else None
                    cur.execute("UPDATE api_users SET failed_attempts=%s,locked_until=%s WHERE id=%s",
                                (0 if until else failures, until, user["id"]))
                db.commit()
                return denied()
            cur.execute("UPDATE api_users SET failed_attempts=0,locked_until=NULL WHERE id=%s", (user["id"],))
            token = secrets.token_urlsafe(32)
            cur.execute("INSERT INTO api_token_sessions(token_hash,user_id,token_issued_at,last_activity_at) VALUES (%s,%s,%s,%s)",
                        (token_hash(token),user["id"],now,now))
        db.commit()
        return accepted(token)
    finally:
        db.close()


def validate_session(request: Request, activity=False, revoke=False, rotate=True):
    username = unquote(request.headers.get("X-Username", ""))
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    if not username or len(username)>190 or scheme.lower()!="bearer" or not token or len(token)>256:
        return None, denied()
    db = connect()
    try:
        with db.cursor() as cur:
            cur.execute("""SELECT s.*,u.username,u.is_active FROM api_token_sessions s
                JOIN api_users u ON u.id=s.user_id
                WHERE s.token_hash=%s AND u.username=%s FOR UPDATE""", (token_hash(token),username))
            row = cur.fetchone()
            now = now_utc()
            if not row or row["revoked_at"]:
                db.commit()
                return None, denied()
            idle = (now-row["last_activity_at"]).total_seconds()
            if not row["is_active"] or idle>=settings.SESSION_IDLE_SECONDS:
                cur.execute("UPDATE api_token_sessions SET revoked_at=%s WHERE id=%s", (now,row["id"]))
                db.commit()
                return None, denied()
            if revoke:
                cur.execute("UPDATE api_token_sessions SET revoked_at=%s WHERE id=%s", (now,row["id"]))
                db.commit()
                return row["user_id"], {"authenticated":False,"message":"სესია დასრულებულია"}
            age = (now-row["token_issued_at"]).total_seconds()
            replacement = None
            remaining = settings.TOKEN_ROTATE_SECONDS-age
            if rotate and age>=settings.TOKEN_ROTATE_SECONDS:
                replacement = secrets.token_urlsafe(32)
                cur.execute("UPDATE api_token_sessions SET token_hash=%s,token_issued_at=%s WHERE id=%s",
                            (token_hash(replacement),now,row["id"]))
                remaining = settings.TOKEN_ROTATE_SECONDS
            if activity:
                cur.execute("UPDATE api_token_sessions SET last_activity_at=%s WHERE id=%s", (now,row["id"]))
        db.commit()
        return row["user_id"], accepted(replacement,remaining)
    finally:
        db.close()
