import json
from typing import Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from database import get_connection
from routers.auth import get_current_user

router = APIRouter(prefix="/api/calendar", tags=["კალენდარული გეგმა"])


def ensure_calendar_table(conn):
    with conn.cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS saved_calendars (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                module_id INT NULL,
                plan_id INT NULL,
                module_name VARCHAR(255) NULL,
                registration_number VARCHAR(100) NULL,
                teacher_name VARCHAR(255) NULL,
                program_name VARCHAR(255) NULL,
                start_date VARCHAR(50) NULL,
                end_date VARCHAR(50) NULL,
                config_json LONGTEXT NULL,
                table_json LONGTEXT NULL,
                created_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
    conn.commit()


class CalendarSavePayload(BaseModel):
    id: Optional[int] = None
    title: str
    module_id: Optional[int] = None
    plan_id: Optional[int] = None
    module_name: Optional[str] = ""
    registration_number: Optional[str] = ""
    teacher_name: Optional[str] = ""
    program_name: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    config_json: Optional[Dict[str, Any]] = None
    table_json: Optional[Dict[str, Any]] = None


@router.get("/init-data")
def get_calendar_init_data(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        ensure_calendar_table(conn)
        modules = []
        plans = []
        resources = []
        teachers = []
        saved_calendars = []

        with conn.cursor() as cursor:
            # 1. მოდულები (ვორდის ფაილებიდან) და მათი სწავლის შედეგები
            try:
                cursor.execute("""
                    SELECT m.*, f.file_name
                    FROM curriculum_modules m
                    LEFT JOIN uploaded_files f ON m.file_id = f.id
                    ORDER BY m.id DESC
                """)
                raw_modules = cursor.fetchall()
                for mod in raw_modules:
                    cursor.execute("""
                        SELECT *
                        FROM curriculum_outcomes
                        WHERE module_id = %s
                        ORDER BY id ASC
                    """, (mod["id"],))
                    outcomes = cursor.fetchall()
                    for oc in outcomes:
                        for k in ("hours_contact", "hours_independent", "hours_evaluation", "hours_total"):
                            if oc.get(k) is not None:
                                oc[k] = float(oc[k])
                    for k in ("credits", "hours_contact", "hours_independent", "hours_evaluation", "hours_total"):
                        if mod.get(k) is not None:
                            mod[k] = float(mod[k])
                    if mod.get("created_at"):
                        mod["created_at"] = str(mod["created_at"])
                    mod["outcomes"] = outcomes
                    modules.append(mod)
            except Exception:
                pass

            # 2. სასწავლო გეგმები (ექსელის ფაილებიდან) - კვირეული დატვირთვით
            try:
                cursor.execute("""
                    SELECT p.*, f.file_name
                    FROM curriculum_plans p
                    LEFT JOIN uploaded_files f ON p.file_id = f.id
                    ORDER BY p.module_order ASC, p.id ASC
                """)
                raw_plans = cursor.fetchall()
                for p in raw_plans:
                    for k in ("credits", "hours_total", "hours_contact", "hours_independent", "hours_evaluation"):
                        if p.get(k) is not None:
                            p[k] = float(p[k])
                    if p.get("created_at"):
                        p["created_at"] = str(p["created_at"])
                    ws_raw = p.get("weekly_schedule")
                    if isinstance(ws_raw, str) and ws_raw.strip():
                        try:
                            p["weekly_schedule_parsed"] = json.loads(ws_raw)
                        except Exception:
                            p["weekly_schedule_parsed"] = []
                    elif isinstance(ws_raw, list):
                        p["weekly_schedule_parsed"] = ws_raw
                    else:
                        p["weekly_schedule_parsed"] = []
                    plans.append(p)
            except Exception:
                pass

            # 3. მატერიალური რესურსები და სასწავლო გარემო
            try:
                cursor.execute("""
                    SELECT id, file_id, module_name, learning_environment, category, item_number, item_name, quantity, unit, note
                    FROM material_resources
                    ORDER BY id ASC
                """)
                resources = cursor.fetchall()
            except Exception:
                pass

            # 4. მასწავლებლები (api_users)
            try:
                cursor.execute("""
                    SELECT id, username, name, role, subject, modules
                    FROM api_users
                    WHERE role IN ('teacher', 'admin')
                    ORDER BY name ASC
                """)
                teachers = cursor.fetchall()
            except Exception:
                pass

            # 5. შენახული კალენდარული გეგმები
            try:
                cursor.execute("""
                    SELECT id, title, module_id, plan_id, module_name, registration_number,
                           teacher_name, program_name, start_date, end_date, created_at, updated_at
                    FROM saved_calendars
                    ORDER BY updated_at DESC
                """)
                raw_saved = cursor.fetchall()
                for s in raw_saved:
                    if s.get("created_at"):
                        s["created_at"] = str(s["created_at"])
                    if s.get("updated_at"):
                        s["updated_at"] = str(s["updated_at"])
                    saved_calendars.append(s)
            except Exception:
                pass

        return {
            "success": True,
            "modules": modules,
            "plans": plans,
            "resources": resources,
            "teachers": teachers,
            "saved_calendars": saved_calendars,
        }
    finally:
        conn.close()


@router.get("/saved/{cal_id}")
def get_saved_calendar(cal_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        ensure_calendar_table(conn)
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM saved_calendars WHERE id = %s", (cal_id,))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="კალენდარული გეგმა ვერ მოიძებნა")
            if row.get("created_at"):
                row["created_at"] = str(row["created_at"])
            if row.get("updated_at"):
                row["updated_at"] = str(row["updated_at"])
            for field in ("config_json", "table_json"):
                val = row.get(field)
                if isinstance(val, str) and val.strip():
                    try:
                        row[field] = json.loads(val)
                    except Exception:
                        row[field] = None
            return {"success": True, "calendar": row}
    finally:
        conn.close()


@router.post("/save")
def save_calendar(payload: CalendarSavePayload, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        ensure_calendar_table(conn)
        config_str = json.dumps(payload.config_json, ensure_ascii=False) if payload.config_json is not None else None
        table_str = json.dumps(payload.table_json, ensure_ascii=False) if payload.table_json is not None else None

        with conn.cursor() as cursor:
            if payload.id:
                cursor.execute("""
                    UPDATE saved_calendars
                    SET title = %s,
                        module_id = %s,
                        plan_id = %s,
                        module_name = %s,
                        registration_number = %s,
                        teacher_name = %s,
                        program_name = %s,
                        start_date = %s,
                        end_date = %s,
                        config_json = %s,
                        table_json = %s
                    WHERE id = %s
                """, (
                    payload.title,
                    payload.module_id,
                    payload.plan_id,
                    payload.module_name,
                    payload.registration_number,
                    payload.teacher_name,
                    payload.program_name,
                    payload.start_date,
                    payload.end_date,
                    config_str,
                    table_str,
                    payload.id
                ))
                cal_id = payload.id
            else:
                cursor.execute("""
                    INSERT INTO saved_calendars (
                        title, module_id, plan_id, module_name, registration_number,
                        teacher_name, program_name, start_date, end_date,
                        config_json, table_json, created_by
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    payload.title,
                    payload.module_id,
                    payload.plan_id,
                    payload.module_name,
                    payload.registration_number,
                    payload.teacher_name,
                    payload.program_name,
                    payload.start_date,
                    payload.end_date,
                    config_str,
                    table_str,
                    current_user.get("id")
                ))
                cal_id = cursor.lastrowid
        conn.commit()
        return {
            "success": True,
            "message": "კალენდარული გეგმა წარმატებით შეინახა",
            "id": cal_id
        }
    finally:
        conn.close()


@router.delete("/saved/{cal_id}")
def delete_saved_calendar(cal_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        ensure_calendar_table(conn)
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM saved_calendars WHERE id = %s", (cal_id,))
        conn.commit()
        return {"success": True, "message": "კალენდარული გეგმა წაიშალა"}
    finally:
        conn.close()
