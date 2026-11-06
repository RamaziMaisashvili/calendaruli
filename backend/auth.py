import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_connection

security = HTTPBearer(auto_error=False)

def now_utc():
    return datetime.utcnow()

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
    return "scrypt$" + salt.hex() + "$" + digest.hex()

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        parts = stored_hash.split("$")
        if len(parts) == 3:
            algo, salt, expected = parts
            if algo == "scrypt":
                digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1)
                return hmac.compare_digest(digest.hex(), expected)
            elif algo == "sha256":
                digest = hashlib.sha256((salt + password).encode()).hexdigest()
                return hmac.compare_digest(digest, expected)
        return False
    except Exception:
        return False

def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def authenticate_user(username: str, password: str):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM api_users WHERE username = %s FOR UPDATE", (username,))
            user = cur.fetchone()
            now = now_utc()
            
            if not user or not user["is_active"]:
                conn.commit()
                return None

            locked = bool(user["locked_until"] and user["locked_until"] > now)
            if locked:
                conn.commit()
                return None

            if not verify_password(password, user["password_hash"]):
                failures = user["failed_attempts"] + 1
                locked_until = now + timedelta(minutes=15) if failures >= 5 else None
                cur.execute(
                    "UPDATE api_users SET failed_attempts = %s, locked_until = %s WHERE id = %s",
                    (0 if locked_until else failures, locked_until, user["id"])
                )
                conn.commit()
                return None

            # წარმატებული ავტორიზაცია
            cur.execute("UPDATE api_users SET failed_attempts = 0, locked_until = NULL WHERE id = %s", (user["id"],))
            token = secrets.token_urlsafe(32)
            cur.execute(
                """INSERT INTO api_token_sessions (token_hash, user_id, token_issued_at, last_activity_at) 
                   VALUES (%s, %s, %s, %s)""",
                (token_hash(token), user["id"], now, now)
            )
            conn.commit()

            return {
                "token": token,
                "user": {
                    "id": user["id"],
                    "username": user["username"],
                    "name": user["name"],
                    "role": user.get("role", "teacher"),
                    "email": user.get("email", ""),
                    "phone": user.get("phone", "")
                }
            }
    finally:
        conn.close()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="ავტორიზაციის ტოკენი არ არის მითითებული")
    
    token = credentials.credentials
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT s.id as session_id, s.token_issued_at, s.last_activity_at, s.revoked_at,
                       u.*
                FROM api_token_sessions s
                JOIN api_users u ON u.id = s.user_id
                WHERE s.token_hash = %s
            """, (token_hash(token),))
            row = cur.fetchone()
            now = now_utc()

            if not row or row["revoked_at"] or not row["is_active"]:
                raise HTTPException(status_code=401, detail="არასწორი ან ვადაგასული სესია")

            cur.execute("UPDATE api_token_sessions SET last_activity_at = %s WHERE id = %s", (now, row["session_id"]))
            conn.commit()

            return {
                "id": row["id"],
                "username": row["username"],
                "name": row["name"],
                "role": row.get("role", "teacher"),
                "email": row.get("email", ""),
                "phone": row.get("phone", "")
            }
    finally:
        conn.close()

def logout_user(token: str):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            now = now_utc()
            cur.execute("UPDATE api_token_sessions SET revoked_at = %s WHERE token_hash = %s", (now, token_hash(token)))
            conn.commit()
    finally:
        conn.close()

# თუ auth.py პირდაპირ ან routers/auth.py-ის ნაცვლად იქნა იმპორტირებული
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(req: LoginRequest):
    result = authenticate_user(req.username.strip(), req.password)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="მომხმარებლის სახელი ან პაროლი არასწორია"
        )
    return {
        "success": True,
        "token": result["token"],
        "user": result["user"],
        "message": "ავტორიზაცია წარმატებით დასრულდა"
    }

@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "user": user
    }

@router.post("/logout")
def logout(credentials = Depends(security)):
    if credentials:
        logout_user(credentials.credentials)
    return {"success": True, "message": "წარმატებით გამოხვედით სისტემიდან"}

