"""
პროფესიული განათლების მოდულების სილაბუსების (.docx) და სასწავლო გეგმების (.xlsx) პარსერი.
საქაღალდე: python/syllabus_parser.py
არ წაშალოთ!
"""

import os
import glob
import json
import zipfile
import re
import xml.etree.ElementTree as ET
from typing import Dict, List, Any, Optional

try:
    import openpyxl
except ImportError:
    openpyxl = None


def extract_docx_tables(docx_path: str) -> List[List[List[str]]]:
    """ამოიღებს ყველა ცხრილს .docx ფაილიდან ტექსტურ ფორმატში."""
    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read('word/document.xml')
    tree = ET.fromstring(xml_content)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    tables = []
    for tbl in tree.findall('.//w:tbl', ns):
        rows = []
        for tr in tbl.findall('.//w:tr', ns):
            cells = []
            for tc in tr.findall('.//w:tc', ns):
                # უჯრის შიგნით არსებული პარაგრაფების ტექსტის გაერთიანება
                cell_text = "\n".join(
                    "".join(p.itertext()).strip() 
                    for p in tc.findall('.//w:p', ns) 
                    if "".join(p.itertext()).strip()
                )
                cells.append(cell_text.strip())
            rows.append(cells)
        tables.append(rows)
    return tables


def parse_module_syllabus(docx_path: str) -> Dict[str, Any]:
    """
    სრულად აანალიზებს მოდულის სილაბუსის .docx ფაილს და აბრუნებს სტრუქტურირებულ მონაცემებს:
    - მოდულის დასახელება, კოდი, კრედიტები, მასწავლებლები;
    - სწავლის შედეგები (სშ) და შესრულების კრიტერიუმები;
    - მოდულის თემატიკა და საათები თითოეული სწავლის შედეგისთვის;
    - საათების განაწილება (საკონტაქტო, დამოუკიდებელი, შეფასება).
    """
    tables = extract_docx_tables(docx_path)
    if not tables:
        return {"error": "ცხრილები ვერ მოიძებნა", "file": os.path.basename(docx_path)}

    module_info = {
        "file_name": os.path.basename(docx_path),
        "module_title": "",
        "code": "",
        "version": "",
        "credits": 0.0,
        "environment": "",
        "location": "",
        "teachers": [],
        "learning_outcomes": [], # სწავლის შედეგები, კრიტერიუმები
        "thematic_plan": [],     # თემატიკა, სწავლების ფორმა, შეფასების მეთოდები
        "hours_distribution": [] # საკონტაქტო, დამოუკიდებელი, შეფასება
    }

    # 1. მეტამონაცემების ცხრილი (ჩვეულებრივ ცხრილი 0)
    meta_table = tables[0]
    for row in meta_table:
        if len(row) >= 2:
            key = row[0].replace("\n", " ").strip()
            val = row[1].replace("\n", " ").strip()
            if "მოდულის სახელწოდება" in key:
                module_info["module_title"] = val
            elif "სარეგისტრაციო ნომერი" in key:
                module_info["code"] = val
            elif "ვერსია" in key:
                module_info["version"] = val
            elif "მოცულობა კრედიტებში" in key:
                try:
                    module_info["credits"] = float(re.sub(r'[^\d.]', '', val))
                except ValueError:
                    module_info["credits"] = val
            elif "განხორციელების გარემო" in key:
                module_info["environment"] = val
            elif "განხორციელების ადგილი" in key:
                module_info["location"] = val
            elif "მასწავლებელი" in key:
                teachers_raw = [t.strip() for t in re.split(r'[;,\n]', val) if t.strip()]
                module_info["teachers"] = teachers_raw

    # 2. სწავლის შედეგები და კრიტერიუმები (ჩვეულებრივ ცხრილი 1)
    if len(tables) > 1:
        lo_table = tables[1]
        # ვეძებთ სათაურის რიგს
        start_idx = 1
        for i, row in enumerate(lo_table):
            row_str = " ".join(row)
            if "სწავლის შედეგები" in row_str and "შესრულების კრიტერიუმები" in row_str:
                start_idx = i + 1
                break

        lo_counter = 1
        for row in lo_table[start_idx:]:
            if len(row) < 3:
                continue
            # უჯრების ამოღება
            num_or_title = row[0].strip()
            title = row[1].strip() if len(row) > 1 else ""
            criteria_raw = row[2].strip() if len(row) > 2 else ""
            scope = row[3].strip() if len(row) > 3 else ""
            assessment_dir = row[4].strip() if len(row) > 4 else ""
            credits_val = row[5].strip() if len(row) > 5 else ""

            # თუ პირველი სვეტი ცარიელია ან ინდექსია
            outcome_title = title if title else num_or_title
            if not outcome_title or "სულ" in outcome_title:
                continue

            # კრიტერიუმების დაყოფა ქვეპუნქტებად (წერტილმძიმით ან ახალი ხაზით)
            criteria_list = [c.strip() for c in re.split(r'[;\n]', criteria_raw) if c.strip()]

            module_info["learning_outcomes"].append({
                "outcome_index": lo_counter,
                "title": outcome_title,
                "criteria": criteria_list,
                "scope": scope,
                "assessment_direction": assessment_dir,
                "credits": credits_val
            })
            lo_counter += 1

    # 3. თემატიკის ცხრილი (ჩვეულებრივ ცხრილი 2)
    if len(tables) > 2:
        thematic_table = tables[2]
        start_idx = 1
        for i, row in enumerate(thematic_table):
            row_str = " ".join(row)
            if "თემატიკა" in row_str or "სწავლის შედეგები№" in row_str:
                start_idx = i + 1
                break

        for row in thematic_table[start_idx:]:
            if len(row) >= 2:
                outcome_num = row[0].strip()
                topics_raw = row[1].strip() if len(row) > 1 else ""
                teaching_form = row[2].strip() if len(row) > 2 else ""
                assessment_methods = row[3].strip() if len(row) > 3 else ""

                if not topics_raw or "სულ" in topics_raw:
                    continue

                # თემების გამოყოფა (ხშირად ერთმანეთზეა მიწერილი ან ახალ ხაზებზე)
                topics = [t.strip() for t in topics_raw.split("\n") if t.strip()]
                if len(topics) <= 1:
                    # თუ ახალ ხაზზე არ იყო, შევინახოთ მთლიანად
                    topics = [topics_raw]

                module_info["thematic_plan"].append({
                    "outcome_index": outcome_num,
                    "topics": topics,
                    "teaching_form": teaching_form,
                    "assessment_methods": assessment_methods
                })

    # 4. საათების განაწილების ცხრილი (ჩვეულებრივ ცხრილი 3)
    if len(tables) > 3:
        hours_table = tables[3]
        start_idx = 2
        for i, row in enumerate(hours_table):
            row_str = " ".join(row)
            if "საკონტაქტო" in row_str or "საათების განაწილება" in row_str:
                start_idx = i + 1

        for row in hours_table[start_idx:]:
            if len(row) >= 4:
                idx_label = row[0].strip()
                contact = row[1].strip()
                independent = row[2].strip() if len(row) > 2 else ""
                assessment = row[3].strip() if len(row) > 3 else ""
                total = row[4].strip() if len(row) > 4 else ""

                if "სულ" in idx_label or "ჯამი" in idx_label:
                    continue

                def to_num(val):
                    try:
                        return float(val.replace(',', '.'))
                    except (ValueError, TypeError):
                        return 0.0

                module_info["hours_distribution"].append({
                    "outcome_index": idx_label,
                    "contact_hours": to_num(contact),
                    "independent_hours": to_num(independent),
                    "assessment_hours": to_num(assessment),
                    "total_hours": to_num(total)
                })

    return module_info


def resolve_folder(folder_name: str) -> str:
    if os.path.exists(folder_name):
        return folder_name
    old_path = os.path.join("old", folder_name)
    if os.path.exists(old_path):
        return old_path
    return folder_name


def parse_program_directory(folder_path: str) -> Dict[str, Any]:
    folder_path = resolve_folder(folder_path)
    """სრულად ასკანირებს პროგრამის საქაღალდეს (ყველა .docx სილაბუსს და .xlsx გეგმას)."""
    if not os.path.exists(folder_path):
        return {"error": f"საქაღალდე {folder_path} არ არსებობს"}

    program_name = os.path.basename(os.path.normpath(folder_path))
    result = {
        "program_name": program_name,
        "folder": folder_path,
        "is_integrated": "ინტეგრირებულ" in folder_path or "ქსელი" in folder_path,
        "curriculum_files": [],
        "modules": []
    }

    # Excel სასწავლო გეგმები
    xlsx_files = glob.glob(os.path.join(folder_path, "*.xlsx"))
    result["curriculum_files"] = [os.path.basename(f) for f in xlsx_files]

    # Word სილაბუსები
    docx_files = glob.glob(os.path.join(folder_path, "*.docx"))
    for df in sorted(docx_files):
        # გამოვტოვოთ პროფესიის სტანდარტი და ლიტერატურის ზოგადი ფაილები
        bname = os.path.basename(df)
        if "სტანდარტი" in bname or "ლიტერატურა" in bname:
            continue
        try:
            parsed = parse_module_syllabus(df)
            if parsed.get("module_title") or parsed.get("learning_outcomes"):
                result["modules"].append(parsed)
        except Exception as e:
            result["modules"].append({
                "file_name": bname,
                "error": str(e)
            })

    return result


def export_all_to_json(target_json_path: str = "python/parsed_curricula.json"):
    """ასკანირებს ორსავე პროგრამას და ინახავს შედეგს სტრუქტურირებულ JSON ფაილში."""
    os.makedirs(os.path.dirname(target_json_path), exist_ok=True)
    all_data = {
        "front_end": parse_program_directory("Front-end დეველოპერი"),
        "networks": parse_program_directory("კომპიუტერული ქსელი და სისტემები")
    }
    with open(target_json_path, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    print(f"შედეგები წარმატებით შეინახა: {target_json_path}")
    print(f"Front-end მოდულები: {len(all_data['front_end']['modules'])}")
    print(f"ქსელების მოდულები: {len(all_data['networks']['modules'])}")
    return all_data


if __name__ == "__main__":
    export_all_to_json()

