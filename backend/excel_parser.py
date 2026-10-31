# Parsing logic adapted from the supplied api.learn.rar curriculum.py.
import re
from datetime import date, datetime, time
from pathlib import Path
from openpyxl.utils import column_index_from_string
from curriculum_parameters import DEFAULT_PARAMETERS, PARAMETER_LABEL_TO_KEY, WEEKDAY_INDEX

def _cell_text(value):
    if value is None:
        return None
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    if isinstance(value, (str, int, float, bool)):
        return value
    return str(value)

def _parameter_values(workbook):
    values = dict(DEFAULT_PARAMETERS)
    if "პარამეტრები" in workbook.sheetnames:
        ws = workbook["პარამეტრები"]
        for row in ws.iter_rows(min_row=5, max_col=2, values_only=True):
            label, value = row
            if not isinstance(label, str) or value is None:
                continue
            key = PARAMETER_LABEL_TO_KEY.get(label.strip().casefold())
            if key:
                values[key] = str(value).strip()
    return values

def _parse_row_ranges(text):
    rows = []
    for part in str(text).split(","):
        part = part.strip()
        if not part:
            continue
        match = re.fullmatch(r"(\d+)\s*(?:-\s*(\d+))?", part)
        if not match:
            raise ValueError("მოდულების სტრიქონები მიუთითე, მაგალითად: 9-28, 29-50")
        start = int(match.group(1))
        end = int(match.group(2) or start)
        if start < 1 or end < start or end > 10000:
            raise ValueError("მოდულების სტრიქონების დიაპაზონი არასწორია.")
        rows.extend(range(start, end + 1))
    if not rows:
        raise ValueError("მოდულების სტრიქონები ცარიელია.")
    if len(rows) > 2000:
        raise ValueError("ერთ იმპორტში 2000-ზე მეტი სტრიქონის წაკითხვა დაუშვებელია.")
    return list(dict.fromkeys(rows))

def _column_index(value, label):
    try:
        return column_index_from_string(str(value).strip().upper())
    except Exception as exc:
        raise ValueError(f"{label}: მიუთითე Excel-ის სვეტის ასო, მაგალითად D ან AA.") from exc

def _number(value):
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.strip().replace(",", ".")
        try:
            return float(cleaned) if cleaned else None
        except ValueError:
            return None
    return None

def _validated_settings(raw, sheetnames, program_type):
    settings = dict(DEFAULT_PARAMETERS)
    settings.update({k: str(v).strip() for k, v in raw.items() if k in settings and v is not None})
    settings['plan_format']=raw.get('plan_format','legacy')
    if settings['plan_format'] not in ('a','b','legacy'):raise ValueError('აირჩიეთ გეგმის ფორმატი.')
    if settings['plan_format']=='a':settings['assessment_column']=''
    if "week_dates_row" not in raw:
        settings["week_dates_row"] = ""
    if program_type not in {"integrated", "non_integrated"}:
        raise ValueError("აირჩიე პროგრამის ტიპი: ინტეგრირებული ან არაინტეგრირებული.")
    if settings["sheet_name"] not in sheetnames:
        settings["sheet_name"] = "ძირითადი" if "ძირითადი" in sheetnames else sheetnames[0]
    module_rows = set(_parse_row_ranges(settings["module_rows"]))
    category_specs = [
        ("integrated_general_rows", "integrated_general", "ინტეგრირებული ზოგადი მოდულები"),
        ("general_module_rows", "general", "ზოგადი მოდულები"),
        ("professional_module_rows", "professional", "პროფესიული მოდულები"),
    ]
    category_rows = {}
    for key, module_type, label in category_specs:
        raw_ranges = settings[key].strip()
        applicable = key != "integrated_general_rows" or program_type == "integrated"
        if not applicable:
            if raw_ranges:
                raise ValueError("არაინტეგრირებულ პროგრამაში ინტეგრირებული ზოგადი მოდულების სტრიქონები არ უნდა იყოს შევსებული.")
            continue
        if not raw_ranges:
            continue
        parsed_rows = set(_parse_row_ranges(raw_ranges))
        if not parsed_rows.issubset(module_rows):
            raise ValueError(f"{label}: მითითებული სტრიქონები უნდა შედიოდეს მოდულების საერთო სტრიქონებში.")
        category_rows[module_type] = parsed_rows
    seen_rows = set()
    module_type_by_row = {}
    for module_type, rows_for_type in category_rows.items():
        overlap = seen_rows & rows_for_type
        if overlap:
            raise ValueError(f"ერთი და იგივე სტრიქონი რამდენიმე მოდულის კატეგორიაშია: {min(overlap)}.")
        seen_rows.update(rows_for_type)
        module_type_by_row.update({row: module_type for row in rows_for_type})
    settings["module_type_by_row"] = module_type_by_row
    for key, label in (("total_column", "სულ"), ("contact_column", "საკონტაქტო"),
                       ("independent_column", "დამოუკიდებელი"), ("assessment_column", "შეფასება"),
                       ("module_name_column", "მოდულის სახელი"), ("first_week_column", "პირველი კვირის სვეტი")):
        if key=='assessment_column' and settings['plan_format']=='a':continue
        _column_index(settings[key], label)
    settings["module_code_column"] = settings["module_code_column"].strip().upper()
    if settings["module_code_column"]:
        code_column = _column_index(settings["module_code_column"], "მოდულის კოდი")
        if code_column == _column_index(settings["module_name_column"], "მოდულის სახელი"):
            raise ValueError("მოდულის კოდის და სახელის სვეტები სხვადასხვა უნდა იყოს.")
    for key, label, maximum in (("week_number_row", "კვირების ნომრების სტრიქონი", 10000),
                                ("first_week_number", "პირველი კვირის ნომერი", 10000),
                                ("week_count", "კვირების რაოდენობა", 200),
                                ("lessons_per_day", "გაკვეთილები დღეში", 24)):
        try:
            value = int(settings[key])
        except (TypeError, ValueError) as exc:
            raise ValueError(f"{label}: მიუთითე დადებითი მთელი რიცხვი.") from exc
        if value < 1 or value > maximum:
            raise ValueError(f"{label}: რიცხვი დასაშვებ ფარგლებს გარეთაა.")
        settings[key] = value
    date_row = settings["week_dates_row"].strip()
    if date_row in {"", "0"}:
        settings["week_dates_row"] = None
    else:
        try:
            date_row = int(date_row)
        except ValueError as exc:
            raise ValueError("კვირების თარიღების სტრიქონი უნდა იყოს დადებითი მთელი რიცხვი ან ცარიელი.") from exc
        if not 1 <= date_row <= 10000:
            raise ValueError("კვირების თარიღების სტრიქონი დასაშვებ ფარგლებს გარეთაა.")
        settings["week_dates_row"] = date_row
    settings["learning_days"] = [x.strip() for x in settings["learning_days"].split(",") if x.strip()]
    if not settings["learning_days"]:
        raise ValueError("მიუთითე სულ მცირე ერთი სასწავლო დღე.")
    if any(day not in WEEKDAY_INDEX for day in settings["learning_days"]):
        raise ValueError("სასწავლო დღეებში გამოიყენე ორშაბათი–კვირა ჩამონათვალის სწორი სახელები.")
    if len(set(settings["learning_days"])) != len(settings["learning_days"]):
        raise ValueError("სასწავლო დღეები დუბლირებული არ უნდა იყოს.")
    return settings

def _extract_modules(workbook, settings):
    ws = workbook[settings["sheet_name"]]
    rows = _parse_row_ranges(settings["module_rows"])
    cols = {
        "name": _column_index(settings["module_name_column"], "მოდულის სახელი"),
        "total": _column_index(settings["total_column"], "სულ"),
        "contact": _column_index(settings["contact_column"], "საკონტაქტო"),
        "independent": _column_index(settings["independent_column"], "დამოუკიდებელი"),
        "assessment": _column_index(settings["assessment_column"], "შეფასება") if settings.get("plan_format")!="a" else None,
    }
    if settings["module_code_column"]:
        cols["code"] = _column_index(settings["module_code_column"], "მოდულის კოდი")
    week_start = _column_index(settings["first_week_column"], "პირველი კვირის სვეტი")
    modules = []
    consumed=set()
    fmt=settings.get('plan_format','legacy')
    stride=3 if fmt=='a' else 2 if fmt=='b' else 1
    for row_number in rows:
        if row_number in consumed:continue
        name_value = ws.cell(row_number, cols["name"]).value
        if name_value is None or not str(name_value).strip():
            continue
        module_type = settings["module_type_by_row"].get(row_number)
        if module_type is None:
            raise ValueError(f"{row_number}-ე სტრიქონის მოდულს კატეგორია არ აქვს მითითებული.")
        if row_number+stride-1>10000:raise ValueError('მოდულის სტრიქონები დასაშვებ ზღვარს სცდება.')
        for next_row in range(row_number+1,row_number+stride):
            next_name=ws.cell(next_row,cols['name']).value
            if next_name is not None and str(next_name).strip()!=str(name_value).strip():
                raise ValueError(f'{next_row}-ე სტრიქონში სხვა მოდულია: გადაამოწმეთ არჩეული ფორმატი და მოდულების საწყისი სტრიქონები.')
        consumed.update(range(row_number,row_number+stride))
        raw_name = str(name_value).strip()
        matches = list(re.finditer(r"(?<![\w.])(\d{2}(?:\.\d{1,2}){2,})(?!\w|\.\d)", raw_name))
        if len(matches) > 1:
            raise ValueError(f"{row_number}-ე სტრიქონში მოდულის სახელთან რამდენიმე კოდია მითითებული.")
        embedded_code = matches[0].group(1) if matches else None
        if matches:
            raw_name = raw_name[:matches[0].start()] + " " + raw_name[matches[0].end():]
            raw_name = re.sub(r"\(\s*\)|\[\s*\]|\{\s*\}", " ", raw_name)
            raw_name = re.sub(r"\s+", " ", raw_name).strip()
            raw_name = re.sub(r"^[\W_]+|[\W_]+$", "", raw_name).strip()
        separate_code = None
        if "code" in cols:
            code_value = ws.cell(row_number, cols["code"]).value
            if code_value is not None and str(code_value).strip():
                separate_code = str(code_value).strip()
                if not re.fullmatch(r"\d{2}(?:\.\d{1,2}){2,}", separate_code):
                    raise ValueError(f"{row_number}-ე სტრიქონში მოდულის კოდის ფორმატი არასწორია: {separate_code}")
        if embedded_code and separate_code and embedded_code != separate_code:
            raise ValueError(f"{row_number}-ე სტრიქონში სახელში და კოდის სვეტში მითითებული კოდები განსხვავდება.")
        module_code = separate_code or embedded_code or ""
        if not raw_name:
            raise ValueError(f"{row_number}-ე სტრიქონში მოდულის სახელი კოდის მოცილების შემდეგ ცარიელია.")
        weekly = []
        for offset in range(settings["week_count"]):
            col = week_start + offset
            value = _number(ws.cell(row_number, col).value)
            week_no = ws.cell(settings["week_number_row"], col).value
            date_value = (
                ws.cell(settings["week_dates_row"], col).value
                if settings["week_dates_row"] is not None else None
            )
            if week_no is None:
                week_no = settings["first_week_number"] + offset
            components={}
            if fmt!='legacy':
                def read_week(r):
                    raw=ws.cell(r,col).value
                    number=_number(raw)
                    if raw is not None and str(raw).strip() and number is None:raise ValueError(f'{r}-ე სტრიქონში კვირის საათები რიცხვი არ არის.')
                    return 0 if number is None else number
                if fmt=='a':
                    value=read_week(row_number+1)
                    components={'total':read_week(row_number),'independent':read_week(row_number+2)}
                else:
                    value=read_week(row_number)
                    components={'total':value+read_week(row_number+1),'independent':read_week(row_number+1)}
            weekly.append({
                **components,
                "week": _cell_text(week_no),
                "date": _cell_text(date_value),
                "hours": value,
            })
        modules.append({
            "order": len(modules) + 1,
            "source_row": row_number,
            "name": raw_name,
            "code": module_code,
            "module_type": module_type,
            "total": _number(ws.cell(row_number, cols["total"]).value),
            "contact": _number(ws.cell(row_number, cols["contact"]).value),
            "independent": _number(ws.cell(row_number, cols["independent"]).value),
            "assessment": _number(ws.cell(row_number, cols["assessment"]).value) if cols["assessment"] else 0,
            "weekly": weekly,
        })
    if not modules:
        raise ValueError("მითითებულ დიაპაზონებსა და სვეტებში მოდულები ვერ მოიძებნა. გადაამოწმე პარამეტრები.")
    names_seen = set()
    for module in modules:
        identity = (module["name"].casefold(), module["code"])
        if identity in names_seen:
            raise ValueError(f"პროგრამაში მოდულის დასახელება მეორდება: {module['name']}")
        names_seen.add(identity)
    return modules

def _program_title(workbook, sheet_name, filename):
    ws = workbook[sheet_name]
    for row in ws.iter_rows(min_row=1, max_row=min(10, ws.max_row or 1), values_only=True):
        for value in row:
            if isinstance(value, str) and ("პროგრამის სახელწოდება" in value or "სასწავლო გეგმა" in value):
                return value.strip()
    return Path(filename).stem
