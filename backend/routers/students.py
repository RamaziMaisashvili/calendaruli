from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from database import get_connection
from auth import get_current_user, hash_password

router = APIRouter(prefix="/api/students", tags=["students"])

def ensure_user_columns():
    """
    უზრუნველყოფს, რომ api_users ცხრილში არსებობდეს ყველა საჭირო სვეტი:
    email, phone, personal_id, city, program, birth_date, role
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

                cur.execute("SHOW COLUMNS FROM api_users LIKE 'personal_id'")
                if not cur.fetchone():
                    cur.execute("ALTER TABLE api_users ADD COLUMN personal_id VARCHAR(50) NOT NULL DEFAULT '' AFTER phone")

                cur.execute("SHOW COLUMNS FROM api_users LIKE 'city'")
                if not cur.fetchone():
                    cur.execute("ALTER TABLE api_users ADD COLUMN city VARCHAR(100) NOT NULL DEFAULT '' AFTER personal_id")

                cur.execute("SHOW COLUMNS FROM api_users LIKE 'program'")
                if not cur.fetchone():
                    cur.execute("ALTER TABLE api_users ADD COLUMN program VARCHAR(190) NOT NULL DEFAULT '' AFTER city")

                cur.execute("SHOW COLUMNS FROM api_users LIKE 'birth_date'")
                if not cur.fetchone():
                    cur.execute("ALTER TABLE api_users ADD COLUMN birth_date VARCHAR(50) NOT NULL DEFAULT '' AFTER program")

                cur.execute("SHOW COLUMNS FROM api_users LIKE 'role'")
                if not cur.fetchone():
                    cur.execute("ALTER TABLE api_users ADD COLUMN role ENUM('admin','teacher','student') NOT NULL DEFAULT 'student' AFTER birth_date")
                conn.commit()
        finally:
            conn.close()
    except Exception:
        pass

# Pydantic მოდელები
class StudentCreateRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=190)
    name: str = Field(..., min_length=2, max_length=190)
    personal_id: Optional[str] = ""
    birth_date: Optional[str] = ""
    phone: Optional[str] = ""
    city: Optional[str] = ""
    program: Optional[str] = "Front-end დეველოპმენტი"
    email: Optional[str] = ""
    role: Optional[str] = "student"
    password: Optional[str] = "1234"
    is_active: Optional[bool] = True

class StudentUpdateRequest(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    personal_id: Optional[str] = None
    birth_date: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    program: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("")
def list_students(
    q: Optional[str] = Query(None, description="ძებნა სახელით, პირადი ნომრით, ქალაქით, პროგრამით, ტელეფონით ან მომხმარებლით"),
    user: dict = Depends(get_current_user)
):
    """
    სტუდენტების სიის წამოღება (ძებნითა და ფილტრაციით)
    """
    ensure_user_columns()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # ვამოწმებთ სვეტების არსებობას დინამიურად
            cur.execute("SHOW COLUMNS FROM api_users")
            cols = {col["Field"] for col in cur.fetchall()}

            select_fields = ["id", "username", "name", "role", "is_active", "failed_attempts", "created_at"]
            for opt_col in ["email", "phone", "personal_id", "city", "program", "birth_date"]:
                if opt_col in cols:
                    select_fields.append(opt_col)

            query = f"SELECT {', '.join(select_fields)} FROM api_users WHERE role = 'student'"
            params = []

            if q and q.strip():
                search_term = f"%{q.strip().lower()}%"
                conds = ["LOWER(name) LIKE %s", "LOWER(username) LIKE %s"]
                params.extend([search_term, search_term])
                
                if "personal_id" in cols:
                    conds.append("personal_id LIKE %s")
                    params.append(search_term)
                if "city" in cols:
                    conds.append("LOWER(city) LIKE %s")
                    params.append(search_term)
                if "program" in cols:
                    conds.append("LOWER(program) LIKE %s")
                    params.append(search_term)
                if "phone" in cols:
                    conds.append("phone LIKE %s")
                    params.append(search_term)
                if "email" in cols:
                    conds.append("LOWER(email) LIKE %s")
                    params.append(search_term)

                query += " AND (" + " OR ".join(conds) + ")"

            query += " ORDER BY id ASC"
            cur.execute(query, tuple(params))
            rows = cur.fetchall()

            students = []
            for r in rows:
                students.append({
                    "id": r["id"],
                    "username": r["username"],
                    "name": r["name"],
                    "personal_id": r.get("personal_id", ""),
                    "birth_date": r.get("birth_date", ""),
                    "phone": r.get("phone", ""),
                    "city": r.get("city", ""),
                    "program": r.get("program", ""),
                    "email": r.get("email", ""),
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
            cur.execute("SHOW COLUMNS FROM api_users")
            cols = {col["Field"] for col in cur.fetchall()}

            select_fields = ["id", "username", "name", "role", "is_active", "created_at"]
            for opt_col in ["email", "phone", "personal_id", "city", "program", "birth_date"]:
                if opt_col in cols:
                    select_fields.append(opt_col)

            cur.execute(f"SELECT {', '.join(select_fields)} FROM api_users WHERE id = %s", (student_id,))
            r = cur.fetchone()
            if not r:
                raise HTTPException(status_code=404, detail="სტუდენტი ვერ მოიძებნა")

            return {
                "success": True,
                "student": {
                    "id": r["id"],
                    "username": r["username"],
                    "name": r["name"],
                    "personal_id": r.get("personal_id", ""),
                    "birth_date": r.get("birth_date", ""),
                    "phone": r.get("phone", ""),
                    "city": r.get("city", ""),
                    "program": r.get("program", ""),
                    "email": r.get("email", ""),
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
    clean_personal_id = (data.personal_id or "").strip()
    clean_city = (data.city or "").strip()
    clean_program = (data.program or "Front-end დეველოპმენტი").strip()
    clean_birth_date = (data.birth_date or "").strip()
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

            cur.execute("SHOW COLUMNS FROM api_users")
            cols = {col["Field"] for col in cur.fetchall()}

            insert_cols = ["username", "name", "role", "password_hash", "is_active", "failed_attempts"]
            vals = [clean_username, clean_name, clean_role, pwd_hash, 1 if data.is_active else 0, 0]

            if "personal_id" in cols:
                insert_cols.append("personal_id")
                vals.append(clean_personal_id)
            if "city" in cols:
                insert_cols.append("city")
                vals.append(clean_city)
            if "program" in cols:
                insert_cols.append("program")
                vals.append(clean_program)
            if "birth_date" in cols:
                insert_cols.append("birth_date")
                vals.append(clean_birth_date)
            if "email" in cols:
                insert_cols.append("email")
                vals.append(clean_email)
            if "phone" in cols:
                insert_cols.append("phone")
                vals.append(clean_phone)

            placeholders = ["%s"] * len(insert_cols)
            insert_sql = f"INSERT INTO api_users ({', '.join(insert_cols)}) VALUES ({', '.join(placeholders)})"
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
                    "personal_id": clean_personal_id,
                    "city": clean_city,
                    "program": clean_program,
                    "birth_date": clean_birth_date,
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

            cur.execute("SHOW COLUMNS FROM api_users")
            cols = {col["Field"] for col in cur.fetchall()}

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

            if "personal_id" in cols and data.personal_id is not None:
                updates.append("personal_id = %s")
                params.append(data.personal_id.strip())

            if "city" in cols and data.city is not None:
                updates.append("city = %s")
                params.append(data.city.strip())

            if "program" in cols and data.program is not None:
                updates.append("program = %s")
                params.append(data.program.strip())

            if "birth_date" in cols and data.birth_date is not None:
                updates.append("birth_date = %s")
                params.append(data.birth_date.strip())

            if "email" in cols and data.email is not None:
                updates.append("email = %s")
                params.append(data.email.strip())

            if "phone" in cols and data.phone is not None:
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
