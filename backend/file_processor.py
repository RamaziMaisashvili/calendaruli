import os
import re
import json
import logging

def norm(s):
    return re.sub(r"\s+", " ", (s or "").replace("\xa0", " ")).strip()

def unique_cells(row):
    seen, out = set(), []
    for c in row.cells:
        if id(c._tc) in seen:
            continue
        seen.add(id(c._tc))
        out.append(c)
    return out

def plain(cell):
    return "\n".join(p.text.strip() for p in cell.paragraphs if p.text.strip())

def elements_to_text(cell):
    lines = []
    bullet_prefixes = ("•", "–", "-", "—", "*", "▪", "▫", "o", "►")
    for p in cell.paragraphs:
        t = p.text.strip()
        if not t:
            continue
        for bp in bullet_prefixes:
            if t.startswith(bp):
                t = t[len(bp):].strip()
                break
        lines.append(t)
    return "\n".join(lines)

def outcome_key(text):
    return norm(text).rstrip(".").strip()

def find_col(headers, *starts):
    for i, h in enumerate(headers):
        if any(h.startswith(s) for s in starts):
            return i
    return None

def to_module_type_id(val) -> int:
    """
    პროფესიული = 1, ზოგადი = 2, ინტეგრირებული = 3
    """
    if str(val) in ["1", "2", "3"]:
        return int(val)
    s = str(val or "").strip()
    if "ინტეგრირებულ" in s:
        return 3
    if "ზოგად" in s:
        return 2
    return 1

def to_module_type_name(val) -> str:
    """
    1 -> 'პროფესიული', 2 -> 'ზოგადი', 3 -> 'ინტეგრირებული'
    """
    s = str(val or "").strip()
    if s in ["1", 1]:
        return "პროფესიული"
    if s in ["2", 2]:
        return "ზოგადი"
    if s in ["3", 3]:
        return "ინტეგრირებული"
    if "ინტეგრირებულ" in s:
        return "ინტეგრირებული"
    if "ზოგად" in s:
        return "ზოგადი"
    return "პროფესიული"

def detect_module_type(doc, original_name=""):
    """
    არჩევს მოდულის ტიპს:
    1 = 'პროფესიული'
    2 = 'ზოგადი'
    3 = 'ინტეგრირებული'
    """
    fname = (original_name or "").lower()
    non_empty_p = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    full_text = " ".join(non_empty_p[:20])
    for t in doc.tables[:2]:
        for r in t.rows[:3]:
            for c in r.cells:
                full_text += " " + c.text

    # 1. ინტეგრირებული მოდული -> 3
    if "სტატუსი - ინტეგრირებული" in full_text or ("ინტეგრირებული" in full_text and len(doc.tables) <= 2):
        return 3

    # 2. ზოგადი მოდული -> 2
    if "სტატუსი - ზოგადი" in full_text or "(ზოგადი)" in full_text or "(ზოგადი)" in fname or "ზოგადი" in fname:
        return 2

    # 3. პროფესიული მოდული -> 1
    return 1

def get_exact_doc_structure(file_path):
    """
    კითხულობს Word დოკუმენტის ელემენტებს ზუსტი თანმიმდევრობით (აბზაცები და ცხრილები),
    რათა ფრონტენდზე 1:1 აისახოს ორიგინალი Word-ის ასლი.
    """
    import docx
    from docx.oxml.text.paragraph import CT_P
    from docx.oxml.table import CT_Tbl
    from docx.table import Table
    from docx.text.paragraph import Paragraph

    doc = docx.Document(file_path)
    elements = []

    for child in doc.element.body:
        if isinstance(child, CT_P):
            p = Paragraph(child, doc)
            t = p.text.strip()
            if not t:
                continue

            align = "left"
            if p.alignment == 1:
                align = "center"
            elif p.alignment == 2:
                align = "right"

            is_bold = any(r.bold for r in p.runs if r.bold) or (p.style and "heading" in p.style.name.lower())

            elements.append({
                "type": "p",
                "text": t,
                "align": align,
                "is_bold": is_bold,
                "style": p.style.name if p.style else "Normal"
            })

        elif isinstance(child, CT_Tbl):
            t = Table(child, doc)
            table_data = []
            for r in t.rows:
                row_cells = []
                seen_cells = set()
                for c in r.cells:
                    if id(c._tc) in seen_cells:
                        continue
                    seen_cells.add(id(c._tc))

                    # col_span-ის გამოთვლა
                    grid_span = 1
                    tcPr = c._tc.get_or_add_tcPr()
                    gs = tcPr.find("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}gridSpan")
                    if gs is not None:
                        try:
                            grid_span = int(gs.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val", 1))
                        except Exception:
                            grid_span = 1

                    row_cells.append({
                        "text": c.text.strip(),
                        "col_span": grid_span
                    })
                table_data.append(row_cells)

            elements.append({
                "type": "table",
                "rows": table_data
            })

    return elements

# ---------------------------------------------------------------
# 1. პროფესიული მოდულის პარსერი
# ---------------------------------------------------------------
def classify_tables_vocational(doc):
    general = std = approaches = hours = None
    for t in doc.tables:
        if not t.rows:
            continue
        first_3_rows_text = []
        for r in t.rows[:3]:
            row_cells = [norm(c.text) for c in unique_cells(r)]
            first_3_rows_text.append(" | ".join(row_cells))
        flat_top = " || ".join(first_3_rows_text)

        if general is None and any("მოდულის სახელწოდება" in ft for ft in first_3_rows_text):
            general = t
        elif std is None and "შესრულების კრიტერიუმები" in flat_top:
            std = t
        elif approaches is None and ("თემატიკა" in flat_top or any("თემატიკა" in ft for ft in first_3_rows_text)):
            approaches = t
        elif hours is None and "საათების განაწილება" in flat_top:
            hours = t
    return general, std, approaches, hours

def read_general_vocational(t):
    info = {}
    for r in t.rows:
        cs = unique_cells(r)
        if len(cs) >= 2:
            info[norm(cs[0].text)] = norm(cs[1].text)
    return info

def read_approaches_vocational(t):
    header_idx = 0
    for idx, r in enumerate(t.rows[:3]):
        heads = [norm(c.text) for c in unique_cells(r)]
        if any("თემატიკა" in h for h in heads):
            header_idx = idx
            break

    headers = [norm(c.text) for c in unique_cells(t.rows[header_idx])]
    c_no = find_col(headers, "სწავლის შედეგები")
    c_them = find_col(headers, "თემატიკა")
    c_meth = find_col(headers, "შეფასების მეთოდები", "შეფასების რეკომენდებული მეთოდები")
    if c_no is None or c_them is None:
        return {}
    res = {}
    row_counter = 1
    for r in t.rows[header_idx + 1:]:
        cs = unique_cells(r)
        if len(cs) < len(headers):
            continue
        raw_key = plain(cs[c_no])
        key = outcome_key(raw_key) or str(row_counter)
        entry = {
            "თემატიკა": elements_to_text(cs[c_them]),
            "მეთოდები": plain(cs[c_meth]) if c_meth is not None else "",
        }
        res[key] = entry
        res[str(row_counter)] = entry
        row_counter += 1
    return res

HOURS_KEYS = ["საკონტაქტო", "დამოუკიდებელი", "შეფასება", "სულ"]

def read_hours_vocational(t):
    header_idx = None
    cols = []
    for i, r in enumerate(t.rows):
        heads = [norm(c.text) for c in unique_cells(r)]
        if "საკონტაქტო" in heads and "სულ" in heads:
            header_idx, cols = i, heads
            break
    if header_idx is None:
        return [], None
    pos = {k: cols.index(k) for k in HOURS_KEYS if k in cols}
    rows, total = [], None
    for r in t.rows[header_idx + 1:]:
        cs = unique_cells(r)
        if len(cs) < len(cols):
            continue
        vals = {k: norm(cs[pos[k]].text) for k in pos if pos[k] < len(cs)}
        if norm(cs[0].text) == "სულ":
            total = vals
        else:
            rows.append(vals)
    return rows, total

def parse_docx_vocational(doc, file_path, original_name):
    general, std, approaches, hours = classify_tables_vocational(doc)
    if std is None:
        return None

    info = read_general_vocational(general) if general else {}
    them = read_approaches_vocational(approaches) if approaches else {}
    hours_rows, hours_total = read_hours_vocational(hours) if hours else ([], None)

    header_idx = 0
    for idx, r in enumerate(std.rows[:3]):
        heads = [norm(c.text) for c in unique_cells(r)]
        if any("შესრულების კრიტერიუმები" in h for h in heads):
            header_idx = idx
            break

    headers = [norm(c.text) for c in unique_cells(std.rows[header_idx])]
    c_no = find_col(headers, "№")
    c_name = find_col(headers, "სწავლის შედეგები")
    c_crit = find_col(headers, "შესრულების კრიტერიუმები")
    c_dir = find_col(headers, "შეფასების მიმართულება")

    items = []
    item_counter = 1
    for r in std.rows[header_idx + 1:]:
        cs = unique_cells(r)
        if len(cs) < len(headers):
            continue
        no_raw = plain(cs[c_no]) if c_no is not None else str(item_counter)
        key = outcome_key(no_raw) or str(item_counter)
        a = them.get(key) or them.get(str(item_counter)) or {"თემატიკა": "", "მეთოდები": ""}

        items.append({
            "№": no_raw or str(item_counter),
            "სწავლის შედეგები": plain(cs[c_name]) if c_name is not None else "",
            "თემატიკა": a.get("თემატიკა", ""),
            "შესრულების კრიტერიუმები": elements_to_text(cs[c_crit]) if c_crit is not None else "",
            "შეფასების მიმართულება": plain(cs[c_dir]) if c_dir is not None else "",
            "შეფასების მეთოდები": a.get("მეთოდები", ""),
        })
        item_counter += 1

    if hours_rows and len(hours_rows) == len(items):
        for it, h in zip(items, hours_rows):
            it["საათები"] = h

    def to_int(val):
        try:
            return int(re.sub(r"[^\d]", "", str(val)))
        except Exception:
            return None

    return {
        "is_module": True,
        "module_type": "პროფესიული",
        "module_name": info.get("მოდულის სახელწოდება", original_name),
        "registration_number": info.get("სარეგისტრაციო ნომერი", ""),
        "version_date": info.get("ვერსია № და თარიღი", ""),
        "credits": info.get("მოცულობა კრედიტებში", ""),
        "hours_contact": to_int(hours_total.get("საკონტაქტო")) if hours_total else None,
        "hours_independent": to_int(hours_total.get("დამოუკიდებელი")) if hours_total else None,
        "hours_evaluation": to_int(hours_total.get("შეფასება")) if hours_total else None,
        "hours_total": to_int(hours_total.get("სულ")) if hours_total else None,
        "outcomes": items
    }

# ---------------------------------------------------------------
# 2. ინტეგრირებული მოდულის პარსერი
# ---------------------------------------------------------------
def parse_docx_integrated(doc, file_path, original_name):
    if len(doc.tables) < 2:
        return None

    t0 = doc.tables[0]
    info = {}
    for r in t0.rows:
        cells = [c.text.strip() for c in r.cells]
        if len(cells) >= 2 and cells[0]:
            k = cells[0].rstrip(":").strip()
            info[k] = cells[1].strip()

    t1 = doc.tables[1]
    items = []
    for r_idx, r in enumerate(t1.rows[1:]):
        cells = [c.text.strip() for c in r.cells]
        if len(cells) >= 2:
            raw_text = cells[0]
            # თუ დაზუსტებებია ან შენიშვნა, გამოვტოვოთ როგორც შედეგი
            if "დაზუსტებები" in raw_text or "ორგანიზება" in raw_text:
                continue

            m = re.match(r"^\(?(\d+)\)?\.?\s*(.*)", raw_text, re.DOTALL)
            num = m.group(1) if m else str(r_idx + 1)
            name = m.group(2).strip() if m else raw_text

            items.append({
                "№": num,
                "სწავლის შედეგები": name,
                "შესრულების კრიტერიუმები": cells[1] if len(cells) > 1 else "",
                "თემატიკა": cells[2] if len(cells) > 2 else "",
                "შეფასების მიმართულება": cells[3] if len(cells) > 3 else "",
                "შეფასების მეთოდები": ""
            })

    mod_name = info.get("სახელწოდება", original_name)
    return {
        "is_module": True,
        "module_type": "ინტეგრირებული",
        "module_name": mod_name,
        "registration_number": info.get("სარეგისტრაციო ნომერი", "ინტეგრირებული"),
        "version_date": "",
        "credits": "",
        "hours_contact": None,
        "hours_independent": None,
        "hours_evaluation": None,
        "hours_total": None,
        "outcomes": items
    }

def parse_docx_curriculum(file_path, original_name):
    """
    არჩევს პროფესიული, ზოგადი თუ ინტეგრირებული მოდულია და შესაბამისად აანალიზებს.
    module_type: 1 = პროფესიული, 2 = ზოგადი, 3 = ინტეგრირებული.
    """
    import docx
    doc = docx.Document(file_path)
    mtype = detect_module_type(doc, original_name) # 1, 2, ან 3

    if mtype == 3:
        res = parse_docx_integrated(doc, file_path, original_name)
        if res:
            res["module_type"] = 3
            return res

    # პროფესიული ან ზოგადი (მიჰყვებიან 4-ცხრილიან სტრუქტურას)
    res = parse_docx_vocational(doc, file_path, original_name)
    if res:
        res["module_type"] = mtype
        return res

    # თუ ვერ ამოიცნო, ვცადოთ ინტეგრირებული
    res = parse_docx_integrated(doc, file_path, original_name)
    if res:
        res["module_type"] = mtype
        return res
    return None

def save_module_to_db(conn, file_id: int, module_data: dict):
    """
    მოდულის და სწავლის შედეგების შენახვა MySQL ბაზაში (module_type: 1 = პროფესიული, 2 = ზოგადი, 3 = ინტეგრირებული).
    """
    m_type_id = to_module_type_id(module_data.get("module_type", 1))
    with conn.cursor() as cur:
        # პირველ რიგში წავშალოთ შვილობილი სწავლის შედეგები (Foreign Key შეზღუდვის გამო), რომ გადაწერისას 500 არ მოხდეს
        cur.execute("""
            DELETE FROM curriculum_outcomes 
            WHERE module_id IN (SELECT id FROM (SELECT id FROM curriculum_modules WHERE file_id = %s) AS tmp)
        """, (file_id,))
        cur.execute("DELETE FROM curriculum_modules WHERE file_id = %s", (file_id,))
        try:
            cur.execute("DELETE FROM doc_elements WHERE file_id = %s", (file_id,))
        except Exception:
            pass

        try:
            cur.execute("""
                INSERT INTO curriculum_modules (
                    file_id, module_name, module_type, registration_number, version_date, credits,
                    hours_contact, hours_independent, hours_evaluation, hours_total
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                file_id,
                module_data["module_name"],
                m_type_id,
                module_data["registration_number"],
                module_data["version_date"],
                module_data["credits"],
                module_data["hours_contact"],
                module_data["hours_independent"],
                module_data["hours_evaluation"],
                module_data["hours_total"]
            ))
        except Exception as err:
            # თუ ბაზაში ჯერ არ არის module_type სვეტი, შევინახოთ ძველი სტრუქტურით
            if "Unknown column 'module_type'" in str(err) or "module_type" in str(err).lower():
                cur.execute("""
                    INSERT INTO curriculum_modules (
                        file_id, module_name, registration_number, version_date, credits,
                        hours_contact, hours_independent, hours_evaluation, hours_total
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    file_id,
                    module_data["module_name"],
                    module_data["registration_number"],
                    module_data["version_date"],
                    module_data["credits"],
                    module_data["hours_contact"],
                    module_data["hours_independent"],
                    module_data["hours_evaluation"],
                    module_data["hours_total"]
                ))
            else:
                raise

        module_id = cur.lastrowid

        def to_int(val):
            try:
                return int(re.sub(r"[^\d]", "", str(val)))
            except Exception:
                return None

        for item in module_data.get("outcomes", []):
            h = item.get("საათები") or {}
            cur.execute("""
                INSERT INTO curriculum_outcomes (
                    module_id, outcome_number, outcome_name, topics, criteria,
                    assessment_direction, assessment_methods,
                    hours_contact, hours_independent, hours_evaluation, hours_total
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                module_id,
                item.get("№", ""),
                item.get("სწავლის შედეგები", ""),
                item.get("თემატიკა", ""),
                item.get("შესრულების კრიტერიუმები", ""),
                item.get("შეფასების მიმართულება", ""),
                item.get("შეფასების მეთოდები", ""),
                to_int(h.get("საკონტაქტო")),
                to_int(h.get("დამოუკიდებელი")),
                to_int(h.get("შეფასება")),
                to_int(h.get("სულ"))
            ))
    conn.commit()

def extract_excel_curriculum(excel_path):
    """
    სასწავლო გეგმის/კურიკულუმის ამოღება Excel-იდან.
    მხარს უჭერს როგორც Front-end-ის, ისე კომპიუტერული ქსელების და სხვა მოდულარული გეგმების სტრუქტურას.
    """
    import openpyxl
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    all_modules = []

    def safe_int(val):
        if not val:
            return 0
        try:
            return int(val)
        except Exception:
            try:
                return int(float(val))
            except Exception:
                return 0

    def clean_t(text):
        if not text:
            return ""
        return re.sub(r"\s+", " ", str(text).replace("\xa0", " ")).strip()

    for sheet_name in wb.sheetnames:
        sheet = wb[sheet_name]
        header_row = None
        for r in range(1, 30):
            for c in range(1, 10):
                val = str(sheet.cell(row=r, column=c).value or "").strip()
                if val in ["N", "№", "N#", "n"]:
                    header_row = r
                    break
            if header_row:
                break

        if not header_row:
            continue

        # დინამიური სვეტების იდენტიფიკაცია
        col_map = {}
        weekly_start = None
        for c in range(1, min(sheet.max_column + 1, 40)):
            r1 = re.sub(r'[\s\r\n\-]+', '', str(sheet.cell(header_row, c).value or '')).lower()
            r2 = re.sub(r'[\s\r\n\-]+', '', str(sheet.cell(header_row + 1, c).value or '')).lower()
            comb = r1 + " " + r2

            if "კვირა" in comb or r2 == "1":
                if weekly_start is None:
                    weekly_start = c
            if "კრედიტ" in comb or comb.startswith("კრ"):
                if "credits" not in col_map: col_map["credits"] = c
            elif "საკონტ" in comb:
                if "contact" not in col_map: col_map["contact"] = c
            elif "დამოუკიდ" in comb:
                if "indep" not in col_map: col_map["indep"] = c
            elif "შეფას" in comb:
                if "assess" not in col_map: col_map["assess"] = c
            elif "სულ" in comb:
                if "total" not in col_map: col_map["total"] = c
            elif any(k in comb for k in ["მოდულ", "დასახელება"]):
                col_map["name"] = c
            elif r1 in ["n", "№"]:
                if "order" not in col_map: col_map["order"] = c

        if weekly_start is None:
            weekly_start = 9
        weekly_offset = weekly_start - 1

        if "name" not in col_map:
            col_map["name"] = 3
        if "order" not in col_map:
            col_map["order"] = 1

        current_status = 2  # 1 = პროფესიული, 2 = ზოგადი, 3 = ინტეგრირებული
        row = header_row + 1

        while row <= sheet.max_row:
            name_val = sheet.cell(row=row, column=col_map["name"]).value
            name_str = clean_t(name_val)

            if not name_str and "order" in col_map:
                for alt_c in [col_map.get("name", 3), 8, 9, 3, 2]:
                    alt_val = clean_t(sheet.cell(row=row, column=alt_c).value)
                    if alt_val and not alt_val.isdigit() and len(alt_val) > 2:
                        name_str = alt_val
                        break

            if any(kw in name_str for kw in ["ზოგადი მოდულები", "პროფესიული მოდულები", "ინტეგრირებული"]):
                if "ზოგადი" in name_str: current_status = 2
                elif "პროფესიული" in name_str: current_status = 1
                elif "ინტეგრირებული" in name_str: current_status = 3
                row += 1
                continue

            order_raw = sheet.cell(row=row, column=col_map.get("order", 1)).value
            if not order_raw and "order" in col_map:
                order_raw = sheet.cell(row=row, column=2).value

            order_int = safe_int(order_raw)
            if order_int <= 0 or not name_str:
                row += 1
                continue

            code_match = re.search(r'([0-9]+(?:\.[0-9]+)+|[0-9]{7})', name_str)
            if code_match:
                reg_num = code_match.group(1)
                mod_clean_name = clean_t(name_str.replace(reg_num, ''))
            else:
                reg_num = ""
                mod_clean_name = name_str

            status = current_status
            if reg_num.startswith("06.1.1.") or "პროფესიული" in name_str:
                status = 1
            elif reg_num.startswith("11.00.") or "ზოგადი" in name_str:
                status = 2

            cred_c = col_map.get("credits")
            credits_val = str(sheet.cell(row=row, column=cred_c).value or "").strip() if cred_c else ""

            contact = safe_int(sheet.cell(row=row, column=col_map.get("contact", 6)).value) if "contact" in col_map else 0
            assess = safe_int(sheet.cell(row=row, column=col_map.get("assess", 8)).value) if "assess" in col_map else 0
            indep = safe_int(sheet.cell(row=row, column=col_map.get("indep", 7)).value) if "indep" in col_map else 0

            if indep == 0 and row + 1 <= sheet.max_row and "indep" in col_map:
                indep = safe_int(sheet.cell(row=row + 1, column=col_map["indep"]).value)

            tot_c = col_map.get("total")
            total = safe_int(sheet.cell(row=row, column=tot_c).value) if tot_c else (contact + assess + indep)
            if total == 0:
                total = contact + assess + indep

            weekly_schedule = []
            for c_idx in range(weekly_start, sheet.max_column + 1):
                w_num = c_idx - weekly_offset
                w_hours = safe_int(sheet.cell(row=row, column=c_idx).value)
                if w_hours > 0:
                    weekly_schedule.append({"week": w_num, "hours": w_hours})

            all_modules.append({
                "order": order_int,
                "module_name": mod_clean_name,
                "registration_number": reg_num,
                "credits": credits_val,
                "status": status,
                "hours_total": total,
                "hours_contact": contact,
                "hours_independent": indep,
                "hours_evaluation": assess,
                "weekly_schedule": weekly_schedule
            })
            row += 1

    return all_modules


def extract_excel_resources(excel_path):
    """
    მატერიალური რესურსების (ინვენტარი, აღჭურვილობა, მასალები) ამოღება Excel-იდან
    """
    import openpyxl
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    all_modules = []

    def clean_t(s):
        if s is None:
            return ""
        s = re.sub(r'<[^>]+>', ' ', str(s))
        return re.sub(r'\s+', ' ', s.replace('\xa0', ' ')).strip()

    for sheet_name in wb.sheetnames:
        sheet = wb[sheet_name]
        current = None
        current_category = None

        for r in range(1, sheet.max_row + 1):
            a = clean_t(sheet.cell(row=r, column=1).value)
            b = clean_t(sheet.cell(row=r, column=2).value)
            c = clean_t(sheet.cell(row=r, column=3).value)
            d = clean_t(sheet.cell(row=r, column=4).value)
            e = clean_t(sheet.cell(row=r, column=5).value)
            f = clean_t(sheet.cell(row=r, column=6).value)
            g = clean_t(sheet.cell(row=r, column=7).value)
            h = clean_t(sheet.cell(row=r, column=8).value)

            if a == 'მოდულის დასახელება' or d == 'ინვენტარი,აღჭურვილობა, მასალა,ნედლეული':
                continue

            if a:
                if current is not None:
                    all_modules.append(current)
                current = {
                    "module_name": a,
                    "learning_environment": b,
                    "items": []
                }
                current_category = "ინვენტარი, აღჭურვილობა"
                continue

            if d:
                d_low = d.lower()
                if 'მასალა' in d_low:
                    current_category = "მასალა, ნედლეული"
                    continue
                elif 'ინვენტარი' in d_low:
                    current_category = "ინვენტარი, აღჭურვილობა"
                    continue

            if current is None or current_category is None:
                continue

            if not c:
                continue

            current["items"].append({
                "category": current_category,
                "item_number": c,
                "item_name": d,
                "quantity": e,
                "unit": f,
                "note": g if g else (h if h else "")
            })

        if current is not None:
            all_modules.append(current)

    return all_modules


def save_curriculum_plan_to_db(conn, file_id: int, modules: list):
    """
    სასწავლო გეგმის შენახვა MySQL-ის curriculum_plans ცხრილში.
    მხარს უჭერს როგორც ინგლისურ, ისე ქართულ ველებს (extract_curriculum.py ფორმატი).
    """
    with conn.cursor() as cur:
        cur.execute("DELETE FROM curriculum_plans WHERE file_id = %s", (file_id,))
        for m in modules:
            order_val = m.get("order") or m.get("რიგი") or m.get("N")
            mod_name = m.get("module_name") or m.get("მოდულის_სახელწოდება") or m.get("სახელი") or ""
            reg_num = m.get("registration_number") or m.get("სარეგისტრაციო_ნომერი") or m.get("კოდი") or ""
            credits_val = m.get("credits") or m.get("მოცულობა_კრედიტებში") or m.get("კრედიტები") or ""
            status_id = to_module_type_id(m.get("status") or m.get("სტატუსი") or 2)

            hours_dict = m.get("საათები") if isinstance(m.get("საათები"), dict) else {}
            h_total = m.get("hours_total") or hours_dict.get("სულ") or 0
            h_contact = m.get("hours_contact") or hours_dict.get("საკონტაქტო") or 0
            h_independent = m.get("hours_independent") or hours_dict.get("დამოუკიდებელი") or 0
            h_evaluation = m.get("hours_evaluation") or hours_dict.get("შეფასება") or 0

            sched = m.get("weekly_schedule") or hours_dict.get("კვირეული_განაწილება") or []
            normalized_sched = []
            for item in sched:
                if isinstance(item, dict):
                    w = item.get("week") or item.get("კვირა") or 0
                    h = item.get("hours") or item.get("საათები") or 0
                    normalized_sched.append({"week": w, "hours": h})

            sched_json = json.dumps(normalized_sched, ensure_ascii=False)
            cur.execute("""
                INSERT INTO curriculum_plans (
                    file_id, module_order, module_name, registration_number, credits,
                    status, hours_total, hours_contact, hours_independent, hours_evaluation,
                    weekly_schedule
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                file_id,
                order_val,
                mod_name,
                reg_num,
                credits_val,
                status_id,
                h_total,
                h_contact,
                h_independent,
                h_evaluation,
                sched_json
            ))
    conn.commit()


def save_material_resources_to_db(conn, file_id: int, modules: list):
    """
    მატერიალური რესურსების შენახვა MySQL-ის material_resources ცხრილში.
    მხარს უჭერს როგორც extract_resources.py ფორმატს, ისე შიდა ფორმატს.
    """
    with conn.cursor() as cur:
        cur.execute("DELETE FROM material_resources WHERE file_id = %s", (file_id,))
        for mod in modules:
            mod_name = mod.get("module_name") or mod.get("მოდულის დასახელება") or ""
            env = mod.get("learning_environment") or mod.get("სასწავლო გარემო") or ""

            # 1. პირდაპირი items სია
            items = mod.get("items") or []

            # 2. extract_resources.py-ის ფორმატი (ინვენტარი და მასალები ცალ-ცალკე სიებად)
            if not items:
                for eq in mod.get("ინვენტარი, აღჭურვილობა") or []:
                    items.append({
                        "category": "ინვენტარი, აღჭურვილობა",
                        "item_number": eq.get("N") or eq.get("item_number"),
                        "item_name": eq.get("დასახელება") or eq.get("item_name"),
                        "quantity": eq.get("რაოდენობა") or eq.get("quantity"),
                        "unit": eq.get("საზომი ერთეული") or eq.get("unit"),
                        "note": eq.get("შენიშვნა") or eq.get("note")
                    })
                for mat in mod.get("მასალა, ნედლეული") or []:
                    items.append({
                        "category": "მასალა, ნედლეული",
                        "item_number": mat.get("N") or mat.get("item_number"),
                        "item_name": mat.get("დასახელება") or mat.get("item_name"),
                        "quantity": mat.get("რაოდენობა") or mat.get("quantity"),
                        "unit": mat.get("საზომი ერთეული") or mat.get("unit"),
                        "note": mat.get("შენიშვნა") or mat.get("note")
                    })

            for it in items:
                cur.execute("""
                    INSERT INTO material_resources (
                        file_id, module_name, learning_environment, category,
                        item_number, item_name, quantity, unit, note
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    file_id,
                    mod_name,
                    env,
                    it.get("category", "ინვენტარი, აღჭურვილობა"),
                    it.get("item_number") or it.get("N"),
                    it.get("item_name") or it.get("დასახელება"),
                    it.get("quantity") or it.get("რაოდენობა"),
                    it.get("unit") or it.get("საზომი ერთეული"),
                    it.get("note") or it.get("შენიშვნა")
                ))
    conn.commit()


def process_uploaded_file(file_path: str, original_name: str, conn=None, file_id=None) -> dict:
    """
    ამუშავებს ატვირთულ ფაილს, წერს ბაზაში და აგენერირებს დოკუმენტის სრულ სტრუქტურას.
    """
    ext = os.path.splitext(original_name)[1].lower()
    summary = {
        "status": "completed",
        "file_name": original_name,
        "extension": ext,
        "details": {}
    }

    try:
        if ext in [".docx", ".doc"]:
            try:
                import docx
            except ImportError:
                raise RuntimeError("სერვერზე არ არის დაინსტალირებული ბიბლიოთეკა 'python-docx' (pip install python-docx)")

            module_data = parse_docx_curriculum(file_path, original_name)
            if module_data and module_data.get("is_module"):
                if conn and file_id:
                    save_module_to_db(conn, file_id, module_data)

                m_type_id = to_module_type_id(module_data.get("module_type", 1))
                m_type_name = to_module_type_name(m_type_id)
                summary["details"] = {
                    "type": f"საგანმანათლებლო მოდული ({m_type_name})",
                    "module_type": m_type_name,
                    "module_type_id": m_type_id,
                    "module_name": module_data["module_name"],
                    "registration_number": module_data["registration_number"],
                    "credits": module_data["credits"],
                    "outcomes_count": len(module_data["outcomes"]),
                    "hours_total": module_data["hours_total"],
                    "note": "მოდულის მონაცემები წარმატებით ჩაიწერა ბაზაში"
                }
                return summary

            # ჩვეულებრივი Word დოკუმენტი
            doc = docx.Document(file_path)
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            summary["details"] = {
                "type": "Word დოკუმენტი",
                "paragraph_count": len(paragraphs),
                "table_count": len(doc.tables)
            }

        elif ext in [".xlsx", ".xls"]:
            import openpyxl
            wb = openpyxl.load_workbook(file_path, data_only=True)

            # შემოწმება: მატერიალური რესურსია თუ სასწავლო გეგმა
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
                resources_data = extract_excel_resources(file_path)
                if conn and file_id:
                    save_material_resources_to_db(conn, file_id, resources_data)

                total_items = sum(len(m.get("items", [])) for m in resources_data)
                summary["details"] = {
                    "type": "მატერიალური რესურსები (Excel)",
                    "modules_count": len(resources_data),
                    "total_items": total_items,
                    "note": f"ჩაწერილია {len(resources_data)} მოდულის მატერიალური რესურსები ბაზაში"
                }
                return summary

            # სასწავლო გეგმა / კურიკულუმი
            curriculum_data = extract_excel_curriculum(file_path)
            if curriculum_data:
                if conn and file_id:
                    save_curriculum_plan_to_db(conn, file_id, curriculum_data)

                summary["details"] = {
                    "type": "სასწავლო გეგმა / კურიკულუმი (Excel)",
                    "modules_count": len(curriculum_data),
                    "total_hours": sum(m.get("hours_total", 0) for m in curriculum_data),
                    "note": f"ჩაწერილია {len(curriculum_data)} მოდული კურიკულუმის გეგმით ბაზაში"
                }
                return summary

            # ჩვეულებრივი Excel
            summary["details"] = {
                "type": "Excel ცხრილი",
                "sheet_count": len(wb.sheetnames)
            }
        else:
            summary["details"] = {
                "type": f"ფაილი ({ext.upper()})",
                "size_bytes": os.path.getsize(file_path)
            }

    except Exception as e:
        import traceback
        logging.error(f"process_uploaded_file error: {e}\n{traceback.format_exc()}")
        summary["status"] = "processed_with_warnings"
        summary["details"] = {
            "error": str(e),
            "note": "ფაილი შენახულია, დეტალების ამოღებისას მოხდა გაფრთხილება"
        }

    return summary
