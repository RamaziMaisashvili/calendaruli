import os
import json
import shutil
from fastapi import APIRouter, Request, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse

from database import get_connection
from auth import get_current_user
from file_processor import process_uploaded_file

router = APIRouter(prefix="/api/files", tags=["Files"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_files(
    files: list[UploadFile] = File(default=[]),
    file: UploadFile = File(default=None),
    overwrite: str = Form("false"),
    user: dict = Depends(get_current_user)
):
    # ფაილის ატვირთვის უფლება აქვს მხოლოდ ადმინისტრატორს (admin)
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ფაილის ატვირთვის უფლება აქვს მხოლოდ ადმინისტრატორს"
        )

    # ვაერთიანებთ როგორც 'files' (multiple), ასევე 'file' (single) ველებს
    all_files = list(files) if files else []
    if file and hasattr(file, 'filename') and file.filename:
        all_files.append(file)

    valid_files = [f for f in all_files if hasattr(f, 'filename') and f.filename]
    if not valid_files:
        raise HTTPException(status_code=400, detail="ფაილი არ არის არჩეული ან ცარიელია")

    is_overwrite = str(overwrite).lower() in ('true', '1', 'yes')

    try:
        from urllib.parse import unquote

        # 1. სახელების შემოწმება და კონფლიქტების დადგენა
        files_to_process = []
        conflicting_names = []

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                for f in valid_files:
                    clean_name = unquote(os.path.basename(f.filename))
                    try:
                        clean_name = clean_name.encode('latin1').decode('utf-8')
                    except Exception:
                        pass

                    saved_path = os.path.join(UPLOAD_DIR, clean_name)

                    cur.execute("SELECT id, original_name FROM uploaded_files WHERE original_name = %s", (clean_name,))
                    existing = cur.fetchone()

                    if existing or os.path.exists(saved_path):
                        conflicting_names.append(clean_name)

                    files_to_process.append({
                        "file": f,
                        "filename": clean_name,
                        "saved_path": saved_path,
                        "existing_id": existing["id"] if existing else None
                    })
        finally:
            conn.close()

        # თუ რომელიმე ფაილი უკვე არსებობს და გადაწერაზე დასტური არ არის
        if conflicting_names and not is_overwrite:
            names_str = ", ".join(conflicting_names)
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={
                    "success": False,
                    "exists": True,
                    "conflicts": conflicting_names,
                    "message": f"ფაილები უკვე არსებობს: {names_str}. გსურთ გადაწერა?"
                }
            )

        # 2. ფაილების შენახვა ორიგინალი სახელით (სახელის შეუცვლელად) და დამუშავება
        saved_records = []
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                for item in files_to_process:
                    f = item["file"]
                    fname = item["filename"]
                    spath = item["saved_path"]
                    ext = os.path.splitext(fname)[1]

                    with open(spath, "wb") as buffer:
                        shutil.copyfileobj(f.file, buffer)

                    fsize = os.path.getsize(spath)

                    if item["existing_id"]:
                        fid = item["existing_id"]
                    else:
                        cur.execute("""
                            INSERT INTO uploaded_files (
                                original_name, stored_name, file_path, file_size, file_type, 
                                status, processing_summary, user_id
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            fname,
                            fname,
                            spath,
                            fsize,
                            f.content_type or ext,
                            "completed",
                            None,
                            user["id"]
                        ))
                        fid = cur.lastrowid

                    # პითონით დამუშავება და მოდულის/შედეგების პირდაპირ ბაზაში ჩაწერა
                    proc_res = process_uploaded_file(spath, fname, conn=conn, file_id=fid)
                    summary_json = json.dumps(proc_res, ensure_ascii=False)

                    cur.execute("""
                        UPDATE uploaded_files 
                        SET file_path = %s, stored_name = %s, file_size = %s, file_type = %s, 
                            status = %s, processing_summary = %s, user_id = %s, created_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """, (
                        spath,
                        fname,
                        fsize,
                        f.content_type or ext,
                        proc_res.get("status", "completed"),
                        summary_json,
                        user["id"],
                        fid
                    ))

                    saved_records.append({
                        "id": fid,
                        "name": fname,
                        "size": fsize,
                        "status": proc_res.get("status", "completed"),
                        "summary": proc_res
                    })
            conn.commit()
        finally:
            conn.close()

        return {
            "success": True,
            "count": len(saved_records),
            "message": f"წარმატებით აიტვირთა და დამუშავდა {len(saved_records)} ფაილი",
            "files": saved_records
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ფაილის დამუშავებისას მოხდა შეცდომა: {str(e)}"
        )

@router.get("")
def list_files(user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if user.get("role") == "teacher":
                cur.execute("""
                    SELECT f.id, f.original_name, f.file_size, f.file_type, f.status, 
                           f.processing_summary, f.created_at, f.user_id, u.name as uploader_name
                    FROM uploaded_files f
                    LEFT JOIN api_users u ON u.id = f.user_id
                    WHERE f.user_id = %s
                    ORDER BY f.id DESC
                """, (user["id"],))
            else:
                cur.execute("""
                    SELECT f.id, f.original_name, f.file_size, f.file_type, f.status, 
                           f.processing_summary, f.created_at, f.user_id, u.name as uploader_name
                    FROM uploaded_files f
                    LEFT JOIN api_users u ON u.id = f.user_id
                    ORDER BY f.id DESC
                """)
            rows = cur.fetchall()
    finally:
        conn.close()

    files = []
    for r in rows:
        summary_data = None
        if r["processing_summary"]:
            try:
                summary_data = json.loads(r["processing_summary"])
            except Exception:
                summary_data = {"raw": r["processing_summary"]}

        files.append({
            "id": r["id"],
            "original_name": r["original_name"],
            "file_size": r["file_size"],
            "file_type": r["file_type"],
            "status": r["status"],
            "summary": summary_data,
            "created_at": str(r["created_at"]),
            "user_id": r["user_id"],
            "uploader_name": r["uploader_name"] or "სისტემა"
        })

    return {
        "success": True,
        "count": len(files),
        "files": files
    }

@router.get("/{file_id}/download")
def download_file(file_id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT original_name, file_path, user_id FROM uploaded_files WHERE id = %s", (file_id,))
            row = cur.fetchone()
    finally:
        conn.close()

    if not row or not os.path.exists(row["file_path"]):
        raise HTTPException(status_code=404, detail="ფაილი ვერ მოიძებნა")

    if user.get("role") == "teacher" and row["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="წვდომა შეზღუდულია: მასწავლებელს შეუძლია მხოლოდ საკუთარი რესურსის დათვალიერება")

    return FileResponse(
        path=row["file_path"],
        filename=row["original_name"],
        media_type="application/octet-stream"
    )

@router.delete("/{file_id}")
def delete_file(file_id: int, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="ფაილის წაშლის უფლება აქვს მხოლოდ ადმინისტრატორს")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT file_path, user_id FROM uploaded_files WHERE id = %s", (file_id,))
            row = cur.fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="ფაილი ვერ მოიძებნა")

            file_path = row["file_path"]
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass

            cur.execute("DELETE FROM uploaded_files WHERE id = %s", (file_id,))
        conn.commit()
    finally:
        conn.close()

    return {"success": True, "message": "ფაილი წარმატებით წაიშალა"}

@router.get("/{file_id}/module")
def get_file_module(file_id: int, user: dict = Depends(get_current_user)):
    """
    აბრუნებს ბაზაში ჩაწერილ მოდულსა და სწავლის შედეგებს.
    თუ ბაზაში ჯერ არ არის, ავტომატურად აანალიზებს ფაილს და წერს ბაზაში.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM curriculum_modules WHERE file_id = %s", (file_id,))
            mod = cur.fetchone()

            # თუ ბაზაში ჯერ არ არის, შევეცადოთ ფაილიდან ამოღებას და ბაზაში ჩაწერას
            if not mod:
                cur.execute("SELECT original_name, file_path FROM uploaded_files WHERE id = %s", (file_id,))
                f_row = cur.fetchone()
                if f_row and os.path.exists(f_row["file_path"]):
                    ext = os.path.splitext(f_row["original_name"])[1].lower()
                    if ext in [".docx", ".doc"]:
                        from file_processor import parse_docx_curriculum, save_module_to_db
                        parsed = parse_docx_curriculum(f_row["file_path"], f_row["original_name"])
                        if parsed and parsed.get("is_module"):
                            save_module_to_db(conn, file_id, parsed)
                            conn.commit()

                            cur.execute("SELECT * FROM curriculum_modules WHERE file_id = %s", (file_id,))
                            mod = cur.fetchone()

            if mod:
                cur.execute("""
                    SELECT outcome_number, outcome_name, topics, criteria, 
                           assessment_direction, assessment_methods,
                           hours_contact, hours_independent, hours_evaluation, hours_total
                    FROM curriculum_outcomes 
                    WHERE module_id = %s 
                    ORDER BY id ASC
                """, (mod["id"],))
                outcomes = cur.fetchall()

                return {
                    "has_module": True,
                    "module": mod,
                    "outcomes": outcomes
                }

            # თუ მოდული არ არის, წავიკითხოთ ჩვეულებრივი Word-ის აბზაცები და ცხრილები
            cur.execute("SELECT original_name, file_path FROM uploaded_files WHERE id = %s", (file_id,))
            f_row = cur.fetchone()
            if f_row and os.path.exists(f_row["file_path"]):
                ext = os.path.splitext(f_row["original_name"])[1].lower()
                if ext in [".docx", ".doc"]:
                    import docx
                    d = docx.Document(f_row["file_path"])
                    blocks = []
                    for p in d.paragraphs:
                        if p.text.strip():
                            blocks.append({"type": "p", "text": p.text})
                    return {
                        "has_module": False,
                        "raw_blocks": blocks,
                        "title": f_row["original_name"]
                    }

            return {"has_module": False}
    finally:
        conn.close()


