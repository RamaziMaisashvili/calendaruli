from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from database import get_connection
from auth import get_current_user, hash_password

router = APIRouter(prefix="/api/students", tags=["students"])

def ensure_user_columns():
    """
    უზრუნველყოფს, რომ api_users ცხრილში არსებობდეს email, phone და role სვეტები
    """
    try:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SHOW COLUMNS FROM api_users LIKE 'email'")
                if not cur.fetchone():
                    cur.execute("ALTER TABLE api_users ADD COLUMN email VARCHAR(190) NOT NULL DEFAULT '' AFTER name")

                cur.execute("SHOW COLUMNS FROM api_users LIKE 'phone'")
                if not cur.fetchone():
                    cur.execute("ALTER TABLE api_users ADD COLUMN phone VARCHAR(50) NOT NULL DEFAULT '' AFTER email")

                cur.execute("SHOW COLUMNS FROM api_users LIKE 'role'")
                if not cur.fetchone():
                    cur.execute("ALTER TABLE api_users ADD COLUMN role ENUM('admin','teacher','student') NOT NULL DEFAULT 'student' AFTER phone")
                conn.commit()
        finally:
            conn.close()
    except Exception:
        pass

# Pydantic მოდელები
class StudentCreateRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=190)
    name: str = Field(..., min_length=2, max_length=190)
    email: Optional[str] = ""
    phone: Optional[str] = ""
    role: Optional[str] = "student"
    password: Optional[str] = "1234"
    is_active: Optional[bool] = True

class StudentUpdateRequest(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("")
def list_students(
    q: Optional[str] = Query(None, description="ძებნა სახელით, მომხმარებლით, მეილით ან ტელეფონით"),
    user: dict = Depends(get_current_user)
):
    """
    სტუდენტების სიის წამოღება (ძებნითა და ფილტრაციით)
    """
    ensure_user_columns()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SHOW COLUMNS FROM api_users LIKE 'email'")
            has_email = bool(cur.fetchone())
            cur.execute("SHOW COLUMNS FROM api_users LIKE 'phone'")
            has_phone = bool(cur.fetchone())

            select_fields = "id, username, name, role, is_active, failed_attempts, created_at"
            if has_email:
                select_fields += ", email"
            if has_phone:
                select_fields += ", phone"

            query = f"SELECT {select_fields} FROM api_users WHERE role = 'student'"
            params = []

            if q and q.strip():
                search_term = f"%{q.strip().lower()}%"
                conds = ["LOWER(name) LIKE %s", "LOWER(username) LIKE %s"]
                params.extend([search_term, search_term])
                if has_email:
                    conds.append("LOWER(email) LIKE %s")
                    params.append(search_term)
                if has_phone:
                    conds.append("phone LIKE %s")
                    params.append(search_term)
                query += " AND (" + " OR ".join(conds) + ")"

            query += " ORDER BY name ASC"
            cur.execute(query, tuple(params))
            rows = cur.fetchall()

            students = []
            for r in rows:
                students.append({
                    "id": r["id"],
                    "username": r["username"],
                    "name": r["name"],
                    "email": r.get("email", ""),
                    "phone": r.get("phone", ""),
                    "role": r.get("role", "student"),
                    "is_active": bool(r.get("is_active", 1)),
                    "created_at": str(r.get("created_at", ""))
                })

            return {
                "success": True,
                "count": len(students),
                "students": students
            }
    finally:
        conn.close()

@router.get("/{student_id}")
def get_student(student_id: int, user: dict = Depends(get_current_user)):
    """
    კონკრეტული სტუდენტის დეტალების წამოღება
    """
    ensure_user_columns()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SHOW COLUMNS FROM api_users LIKE 'email'")
            has_email = bool(cur.fetchone())
            cur.execute("SHOW COLUMNS FROM api_users LIKE 'phone'")
            has_phone = bool(cur.fetchone())

            fields = "id, username, name, role, is_active, created_at"
            if has_email: fields += ", email"
            if has_phone: fields += ", phone"

            cur.execute(f"SELECT {fields} FROM api_users WHERE id = %s", (student_id,))
            r = cur.fetchone()
            if not r:
                raise HTTPException(status_code=404, detail="სტუდენტი ვერ მოიძებნა")

            return {
                "success": True,
                "student": {
                    "id": r["id"],
                    "username": r["username"],
                    "name": r["name"],
                    "email": r.get("email", ""),
                    "phone": r.get("phone", ""),
                    "role": r.get("role", "student"),
                    "is_active": bool(r.get("is_active", 1)),
                    "created_at": str(r.get("created_at", ""))
                }
            }
    finally:
        conn.close()

@router.post("")
def create_student(data: StudentCreateRequest, user: dict = Depends(get_current_user)):
    """
    ახალი სტუდენტის შექმნა (მხოლოდ ადმინისტრატორს)
    """
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="სტუდენტის დამატების უფლება აქვს მხოლოდ ადმინისტრატორს")

    ensure_user_columns()
    clean_username = data.username.strip().lower()
    clean_name = data.name.strip()
    clean_email = (data.email or "").strip()
    clean_phone = (data.phone or "").strip()
    clean_role = (data.role or "student").strip().lower()
    if clean_role not in ["admin", "teacher", "student"]:
        clean_role = "student"
    raw_pwd = (data.password or "").strip() or "1234"

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # ვამოწმებთ უნიკალურობას username-ზე
            cur.execute("SELECT id FROM api_users WHERE username = %s", (clean_username,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail=f"მომხმარებელი სახელით '{clean_username}' უკვე არსებობს")

            pwd_hash = hash_password(raw_pwd)

            # ვამოწმებთ სვეტებს
            cur.execute("SHOW COLUMNS FROM api_users LIKE 'email'")
            has_email = bool(cur.fetchone())
            cur.execute("SHOW COLUMNS FROM api_users LIKE 'phone'")
            has_phone = bool(cur.fetchone())

            cols = ["username", "name", "role", "password_hash", "is_active", "failed_attempts"]
            vals = [clean_username, clean_name, clean_role, pwd_hash, 1 if data.is_active else 0, 0]
            placeholders = ["%s"] * len(cols)

            if has_email:
                cols.append("email")
                vals.append(clean_email)
                placeholders.append("%s")
            if has_phone:
                cols.append("phone")
                vals.append(clean_phone)
                placeholders.append("%s")

            insert_sql = f"INSERT INTO api_users ({', '.join(cols)}) VALUES ({', '.join(placeholders)})"
            cur.execute(insert_sql, tuple(vals))
            conn.commit()
            new_id = cur.lastrowid

            return {
                "success": True,
                "message": "სტუდენტი წარმატებით დაემატა",
                "student": {
                    "id": new_id,
                    "username": clean_username,
                    "name": clean_name,
                    "email": clean_email,
                    "phone": clean_phone,
                    "role": clean_role,
                    "is_active": data.is_active
                }
            }
    finally:
        conn.close()

@router.put("/{student_id}")
def update_student(student_id: int, data: StudentUpdateRequest, user: dict = Depends(get_current_user)):
    """
    სტუდენტის რედაქტირება (მხოლოდ ადმინისტრატორს)
    """
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="სტუდენტის რედაქტირების უფლება აქვს მხოლოდ ადმინისტრატორს")

    ensure_user_columns()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM api_users WHERE id = %s", (student_id,))
            existing = cur.fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail="სტუდენტი ვერ მოიძებნა")

            updates = []
            params = []

            if data.username is not None:
                new_username = data.username.strip().lower()
                if new_username and new_username != existing["username"]:
                    cur.execute("SELECT id FROM api_users WHERE username = %s AND id != %s", (new_username, student_id))
                    if cur.fetchone():
                        raise HTTPException(status_code=400, detail=f"მომხმარებელი სახელით '{new_username}' უკვე დაკავებულია")
                    updates.append("username = %s")
                    params.append(new_username)

            if data.name is not None and data.name.strip():
                updates.append("name = %s")
                params.append(data.name.strip())

            cur.execute("SHOW COLUMNS FROM api_users LIKE 'email'")
            has_email = bool(cur.fetchone())
            if has_email and data.email is not None:
                updates.append("email = %s")
                params.append(data.email.strip())

            cur.execute("SHOW COLUMNS FROM api_users LIKE 'phone'")
            has_phone = bool(cur.fetchone())
            if has_phone and data.phone is not None:
                updates.append("phone = %s")
                params.append(data.phone.strip())

            if data.role is not None:
                new_role = data.role.strip().lower()
                if new_role not in ["admin", "teacher", "student"]:
                    raise HTTPException(status_code=400, detail="როლი უნდა იყოს ერთ-ერთი: student, teacher, admin")
                updates.append("role = %s")
                params.append(new_role)

            if data.password is not None and data.password.strip():
                updates.append("password_hash = %s")
                params.append(hash_password(data.password.strip()))

            if data.is_active is not None:
                updates.append("is_active = %s")
                params.append(1 if data.is_active else 0)

            if updates:
                sql = f"UPDATE api_users SET {', '.join(updates)} WHERE id = %s"
                params.append(student_id)
                cur.execute(sql, tuple(params))
                conn.commit()

            return {
                "success": True,
                "message": "სტუდენტის მონაცემები წარმატებით განახლდა"
            }
    finally:
        conn.close()

@router.delete("/{student_id}")
def delete_student(student_id: int, user: dict = Depends(get_current_user)):
    """
    სტუდენტის წაშლა (მხოლოდ ადმინისტრატორს)
    """
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="სტუდენტის წაშლის უფლება აქვს მხოლოდ ადმინისტრატორს")

    if user["id"] == student_id:
        raise HTTPException(status_code=400, detail="საკუთარი ანგარიშის წაშლა შეუძლებელია")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, username, role FROM api_users WHERE id = %s", (student_id,))
            target = cur.fetchone()
            if not target:
                raise HTTPException(status_code=404, detail="სტუდენტი ვერ მოიძებნა")

            if target.get("role") == "admin":
                raise HTTPException(status_code=400, detail="ადმინისტრატორის ანგარიშის წაშლა შეუძლებელია")

            cur.execute("DELETE FROM api_users WHERE id = %s", (student_id,))
            conn.commit()

            return {
                "success": True,
                "message": f"სტუდენტი ({target['username']}) წარმატებით წაიშალა"
            }
    finally:
        conn.close()
