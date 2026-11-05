"""
პროფესიული სასწავლო გეგმების (.xlsx) მატრიცული პარსერი.
საქაღალდე: python/curriculum_excel_parser.py
არ წაშალოთ!
"""

import os
import re
import json
from typing import Dict, List, Any

try:
    import openpyxl
except ImportError:
    raise SystemExit("საჭიროა openpyxl ბიბლიოთეკა: pip install openpyxl")


def clean_str(val) -> str:
    if val is None:
        return ""
    return re.sub(r'\s+', ' ', str(val)).strip()


def parse_frontend_curriculum(xlsx_path: str) -> Dict[str, Any]:
    """
    კითხულობს Front-end დეველოპმენტის სასწავლო გეგმას (.xlsx).
    ამოიღებს მოდულების ნუსხას, კრედიტებს, საათებს და კვირეულ განაწილებას.
    """
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    ws = wb.active

    data = {
        "program_title": "Front-end დეველოპმენტი",
        "program_type": "non_integrated", # არაინტეგრირებული (ჩვეულებრივი)
        "file_name": os.path.basename(xlsx_path),
        "modules": []
    }

    # ვეძებთ მოდულების სტრიქონებს
    current_category = "ზოგადი მოდულები"
    for r in range(1, ws.max_row + 1):
        c1 = clean_str(ws.cell(r, 1).value)
        c3 = clean_str(ws.cell(r, 3).value)

        if "პროფესიული მოდულები" in c1 or "პროფესიული მოდულები" in c3:
            current_category = "პროფესიული მოდულები"
            continue
        if "ზოგადი მოდულები" in c1 or "ზოგადი მოდულები" in c3:
            current_category = "ზოგადი მოდულები"
            continue

        # მოდულის რიგის ამოცნობა: N სვეტში არის რიცხვი
        if c1.isdigit():
            mod_num = int(c1)
            credits_val = ws.cell(r, 2).value or 0
            mod_title = clean_str(ws.cell(r, 3).value)
            teacher_name = clean_str(ws.cell(r, 4).value)
            total_hours = ws.cell(r, 5).value or 0

            # კვირეული საათების ამოკითხვა (სვეტი 6-დან ბოლომდე)
            weekly_hours = {}
            for col in range(6, ws.max_column + 1):
                week_num = col - 5
                val = ws.cell(r, col).value
                if val is not None:
                    try:
                        h = float(val)
                        if h > 0:
                            weekly_hours[week_num] = h
                    except (ValueError, TypeError):
                        pass

            data["modules"].append({
                "number": mod_num,
                "category": current_category,
                "title": mod_title,
                "credits": float(credits_val) if isinstance(credits_val, (int, float)) else credits_val,
                "teacher": teacher_name,
                "total_hours": total_hours,
                "weekly_hours": weekly_hours
            })

    return data


def parse_networks_curriculum(xlsx_path: str) -> Dict[str, Any]:
    """
    კითხულობს კომპიუტერული ქსელი და სისტემების სასწავლო გეგმას (.xlsx).
    ეს არის ინტეგრირებული პროგრამა (სკოლის კომპონენტით).
    """
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    
    data = {
        "program_title": "კომპიუტერული ქსელი და სისტემები",
        "program_type": "integrated", # ინტეგრირებული (ზოგადსაგანმანათლებლო კომპონენტით)
        "file_name": os.path.basename(xlsx_path),
        "sheets": wb.sheetnames,
        "modules": []
    }

    ws = wb["ძირითადი"] if "ძირითადი" in wb.sheetnames else wb.active

    current_category = "ინტეგრირებული ზოგადი მოდულები"
    for r in range(1, ws.max_row + 1):
        c1 = clean_str(ws.cell(r, 1).value)
        c2 = clean_str(ws.cell(r, 2).value)
        c5 = clean_str(ws.cell(r, 5).value)

        row_text = f"{c1} {c2} {c5}"
        if "პროფესიული მოდულები" in row_text:
            current_category = "პროფესიული მოდულები"
            continue
        elif "ინტეგრირებული ზოგადი მოდულები" in row_text:
            current_category = "ინტეგრირებული ზოგადი მოდულები"
            continue

        # მოდულის ამოცნობა
        if c1.isdigit():
            mod_num = int(c1)
            title = c5 if c5 else c2
            credits_val = ws.cell(r, 3).value or 0
            total_hours = ws.cell(r, 4).value or 0

            # კვირეული საათების ამოღება
            weekly_hours = {}
            for col in range(6, ws.max_column + 1):
                week_num = col - 5
                val = ws.cell(r, col).value
                if val is not None:
                    try:
                        h = float(val)
                        if h > 0:
                            weekly_hours[week_num] = h
                    except (ValueError, TypeError):
                        pass

            data["modules"].append({
                "number": mod_num,
                "category": current_category,
                "title": title,
                "credits": float(credits_val) if isinstance(credits_val, (int, float)) else credits_val,
                "total_hours": total_hours,
                "weekly_hours": weekly_hours
            })

    return data


def resolve_file(file_path: str) -> str:
    if os.path.exists(file_path):
        return file_path
    old_path = os.path.join("old", file_path)
    if os.path.exists(old_path):
        return old_path
    return file_path


def export_plans_to_json(out_path: str = "python/parsed_plans.json"):
    """აკეთებს ორივე სასწავლო გეგმის ექსპორტს JSON ფაილში."""
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    results = {}

    fe_path = resolve_file("Front-end დეველოპერი/დანართი 16 - სასწავლო გეგმა Front-end.xlsx")
    if os.path.exists(fe_path):
        results["front_end"] = parse_frontend_curriculum(fe_path)

    net_path = resolve_file("კომპიუტერული ქსელი და სისტემები/კომპიუტერული ქსელი და სისტემები.xlsx")
    if os.path.exists(net_path):
        results["networks"] = parse_networks_curriculum(net_path)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"სასწავლო გეგმები წარმატებით შეინახა: {out_path}")
    for k, v in results.items():
        print(f" - {v['program_title']} ({v['program_type']}): {len(v['modules'])} მოდული")
    return results


if __name__ == "__main__":
    export_plans_to_json()

