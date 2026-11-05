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
                        "summary": proc_res,
                        "error": proc_res.get("details", {}).get("error"),
                        "warning": (
                            proc_res.get("details", {}).get("note")
                            if proc_res.get("status") == "processed_with_warnings"
                            else None
                        )
                    })
            conn.commit()
        finally:
            conn.close()

        warnings = [
            {
                "id": record["id"],
                "name": record["name"],
                "error": record["error"],
                "warning": record["warning"],
            }
            for record in saved_records
            if record["status"] == "processed_with_warnings"
        ]
        message = f"წარმატებით აიტვირთა და დამუშავდა {len(saved_records)} ფაილი"
        if warnings:
            warning_lines = [
                f"{item['name']}: {item['warning'] or 'დამუშავება დასრულდა გაფრთხილებით'}. "
                f"შეცდომა: {item['error'] or 'შეცდომის აღწერა არ არის მოწოდებული'}"
                for item in warnings
            ]
            message = (
                f"აიტვირთა {len(saved_records)} ფაილი. "
                f"გაფრთხილებით დამუშავდა {len(warnings)} ფაილი.\n"
                + "\n".join(warning_lines)
            )

        return {
            "success": True,
            "count": len(saved_records),
            "has_warnings": bool(warnings),
            "warnings": warnings,
            "message": message,
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
            "error": (summary_data or {}).get("details", {}).get("error") if isinstance(summary_data, dict) else None,
            "warning": (
                (summary_data or {}).get("details", {}).get("note")
                if isinstance(summary_data, dict) and r["status"] == "processed_with_warnings"
                else None
            ),
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
    აბრუნებს ბაზაში ჩაწერილ მოდულსა და სწავლის შედეგებს,
    ან Excel-ის სასწავლო გეგმას / მატერიალურ რესურსებს.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT original_name, file_path FROM uploaded_files WHERE id = %s", (file_id,))
            f_row = cur.fetchone()
            if not f_row:
                raise HTTPException(status_code=404, detail="ფაილი ვერ მოიძებნა")

            ext = os.path.splitext(f_row["original_name"])[1].lower()

            # 1. Excel-ის მატერიალური რესურსების შემოწმება
            cur.execute("SELECT * FROM material_resources WHERE file_id = %s ORDER BY id ASC", (file_id,))
            res_rows = cur.fetchall()

            # 2. Excel-ის სასწავლო გეგმის შემოწმება
            cur.execute("SELECT * FROM curriculum_plans WHERE file_id = %s ORDER BY module_order ASC", (file_id,))
            plan_rows = cur.fetchall()

            # თუ ჯერ არ არის გაპარსული Excel, ადგილზე დავამუშაოთ
            if not res_rows and not plan_rows and ext in [".xlsx", ".xls"] and os.path.exists(f_row["file_path"]):
                from file_processor import extract_excel_resources, extract_excel_curriculum, save_material_resources_to_db, save_curriculum_plan_to_db
                import openpyxl
                wb = openpyxl.load_workbook(f_row["file_path"], data_only=True)

                is_resources = False
                for sname in wb.sheetnames:
                    sheet = wb[sname]
                    for r in range(1, 12):
                        row_txt = " ".join([str(sheet.cell(row=r, column=c).value or "") for c in range(1, 10)])
                        if any(k in row_txt for k in ["ინვენტარი", "აღჭურვილობა", "მასალა", "ნედლეული"]):
                            is_resources = True
                            break
                    if is_resources:
                        break

                if is_resources:
                    res_data = extract_excel_resources(f_row["file_path"])
                    save_material_resources_to_db(conn, file_id, res_data)
                    cur.execute("SELECT * FROM material_resources WHERE file_id = %s ORDER BY id ASC", (file_id,))
                    res_rows = cur.fetchall()
                else:
                    curr_data = extract_excel_curriculum(f_row["file_path"])
                    if curr_data:
                        save_curriculum_plan_to_db(conn, file_id, curr_data)
                        cur.execute("SELECT * FROM curriculum_plans WHERE file_id = %s ORDER BY module_order ASC", (file_id,))
                        plan_rows = cur.fetchall()

            if res_rows:
                # დავაჯგუფოთ მოდულების მიხედვით
                modules_map = {}
                for r in res_rows:
                    mname = r["module_name"]
                    if mname not in modules_map:
                        modules_map[mname] = {
                            "module_name": mname,
                            "learning_environment": r["learning_environment"],
                            "equipment": [],
                            "materials": []
                        }
                    cat = r["category"]
                    item = {
                        "number": r["item_number"],
                        "name": r["item_name"],
                        "quantity": r["quantity"],
                        "unit": r["unit"],
                        "note": r["note"]
                    }
                    if "მასალა" in cat:
                        modules_map[mname]["materials"].append(item)
                    else:
                        modules_map[mname]["equipment"].append(item)

                return {
                    "is_material_resources": True,
                    "title": f_row["original_name"],
                    "modules": list(modules_map.values()),
                    "total_count": len(res_rows)
                }

            if plan_rows:
                from file_processor import to_module_type_name, to_module_type_id
                for p in plan_rows:
                    if p["weekly_schedule"]:
                        try:
                            p["weekly_schedule"] = json.loads(p["weekly_schedule"])
                        except Exception:
                            p["weekly_schedule"] = []
                    # გამოტანისას სიტყვებით ჩვენება (1 -> პროფესიული, 2 -> ზოგადი, 3 -> ინტეგრირებული)
                    p["status_id"] = to_module_type_id(p.get("status"))
                    p["status"] = to_module_type_name(p.get("status"))

                return {
                    "is_curriculum_plan": True,
                    "title": f_row["original_name"],
                    "plans": plan_rows,
                    "total_count": len(plan_rows)
                }

            # 3. DOCX მოდულის შემოწმება
            cur.execute("SELECT * FROM curriculum_modules WHERE file_id = %s", (file_id,))
            mod = cur.fetchone()

            if not mod and ext in [".docx", ".doc"] and os.path.exists(f_row["file_path"]):
                from file_processor import parse_docx_curriculum, save_module_to_db
                parsed = parse_docx_curriculum(f_row["file_path"], f_row["original_name"])
                if parsed and parsed.get("is_module"):
                    save_module_to_db(conn, file_id, parsed)
                    cur.execute("SELECT * FROM curriculum_modules WHERE file_id = %s", (file_id,))
                    mod = cur.fetchone()

            # Word-ის ზუსტი სტრუქტურის ამოღება (1:1 ასლისთვის)
            doc_elements = []
            actual_file_path = None
            if ext in [".docx", ".doc"]:
                from urllib.parse import unquote
                orig = f_row.get("original_name", "")
                unquoted_orig = unquote(orig)
                raw_path = f_row.get("file_path", "")
                base_fname = os.path.basename(raw_path.replace("\\", "/")) if raw_path else ""

                search_dirs = [
                    UPLOAD_DIR,
                    os.path.join(BASE_DIR, "uploads"),
                    os.path.join(BASE_DIR, "..", "uploads"),
                    "/var/www/calendar.learn/backend/uploads",
                    "/var/www/calendar.learn/uploads",
                    os.path.dirname(raw_path) if raw_path else None
                ]

                possible_paths = [
                    raw_path,
                    os.path.abspath(raw_path) if raw_path else None,
                ]

                for d in search_dirs:
                    if d and os.path.isdir(d):
                        possible_paths.extend([
                            os.path.join(d, orig),
                            os.path.join(d, unquoted_orig),
                            os.path.join(d, base_fname),
                        ])

                for p in possible_paths:
                    if p and os.path.isfile(p):
                        actual_file_path = p
                        break

                # თუ პირდაპირი გზით ვერ იპოვა, მოვძებნოთ საქაღალდეებში სახელის შესაბამისობით
                if not actual_file_path:
                    for d in search_dirs:
                        if d and os.path.isdir(d):
                            for fname in os.listdir(d):
                                if fname == orig or fname == unquoted_orig or fname.lower() == orig.lower() or fname.lower() == unquoted_orig.lower():
                                    actual_file_path = os.path.join(d, fname)
                                    break
                            if actual_file_path:
                                break

                if actual_file_path:
                    try:
                        from file_processor import get_exact_doc_structure
                        doc_elements = get_exact_doc_structure(actual_file_path)
                    except Exception as e:
                        logging.error(f"get_exact_doc_structure error on {actual_file_path}: {e}")

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

                # მოდულის ტიპი პირდაპირ ბაზიდან (curriculum_modules.module_type: 1=პროფესიული, 2=ზოგადი, 3=ინტეგრირებული)
                from file_processor import to_module_type_name, to_module_type_id
                db_type = mod.get("module_type")
                if db_type is not None and str(db_type).strip() != "":
                    mod_type_name = to_module_type_name(db_type)
                    mod_type_id = to_module_type_id(db_type)
                elif actual_file_path:
                    try:
                        import docx
                        from file_processor import detect_module_type
                        doc_obj = docx.Document(actual_file_path)
                        detected_id = detect_module_type(doc_obj, f_row["original_name"])
                        mod_type_name = to_module_type_name(detected_id)
                        mod_type_id = detected_id
                    except Exception:
                        mod_type_name = "პროფესიული"
                        mod_type_id = 1
                else:
                    mod_type_name = "პროფესიული"
                    mod_type_id = 1

                mod["module_type_id"] = mod_type_id
                mod["module_type"] = mod_type_name

                return {
                    "has_module": True,
                    "module": mod,
                    "module_type": mod_type_name,
                    "module_type_id": mod_type_id,
                    "outcomes": outcomes,
                    "doc_elements": doc_elements
                }

            # მოდულის ტიპის განსაზღვრა ჩვეულებრივი Word ფაილისთვისაც
            general_type = "პროფესიული"
            if ext in [".docx", ".doc"] and actual_file_path:
                try:
                    import docx
                    from file_processor import detect_module_type, to_module_type_name
                    doc_obj = docx.Document(actual_file_path)
                    general_type = to_module_type_name(detect_module_type(doc_obj, f_row["original_name"]))
                except Exception:
                    pass

            return {
                "has_module": False,
                "module_type": general_type,
                "title": f_row["original_name"],
                "doc_elements": doc_elements
            }
    finally:
        conn.close()


