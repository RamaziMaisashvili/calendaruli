"""Excel reading defaults and parameter labels. No application startup code."""

PARAMETERS = [
    (5, "მონაცემების ფურცელი", "sheet_name", "ძირითადი", "ფურცლის სახელი, საიდანაც იკითხება მოდულები. თუ არ არსებობს, გამოიყენება პირველი ფურცელი."),
    (6, "მოდულების სტრიქონები", "module_rows", "29-50, 9-28", "მოდულების სტრიქონები. დიაპაზონები მძიმით გამოყავი; დამუშავების რიგიც ამ რიგს მიჰყვება."),
    (7, "სვეტი: სულ", "total_column", "D", "მოდულის საათები სულ."),
    (8, "სვეტი: საკონტაქტო", "contact_column", "E", "საკონტაქტო საათები."),
    (9, "სვეტი: დამოუკიდებელი", "independent_column", "F", "დამოუკიდებელი საათები."),
    (10, "სვეტი: შეფასება", "assessment_column", "G", "შეფასების საათები."),
    (11, "სვეტი: მოდულის სახელი", "module_name_column", "I", "მოდულის სახელის სვეტი."),
    (22, "სვეტი: მოდულის კოდი", "module_code_column", "", "არასავალდებულო. თუ კოდი მოდულის სახელის უჯრაში არ წერია, მიუთითე მისი სვეტი."),
    (23, "ინტეგრირებული ზოგადი მოდულების სტრიქონები", "integrated_general_rows", "", "ინტეგრირებული პროგრამისთვის ამ კატეგორიის მოდულების სტრიქონები."),
    (24, "ზოგადი მოდულების სტრიქონები", "general_module_rows", "", "ზოგადი მოდულების სტრიქონები."),
    (25, "პროფესიული მოდულების სტრიქონები", "professional_module_rows", "", "პროფესიული მოდულების სტრიქონები."),
    (12, "კვირების ნომრების სტრიქონი", "week_number_row", "6", "სტრიქონი, სადაც კვირის ნომრები წერია."),
    (13, "კვირების თარიღების სტრიქონი", "week_dates_row", "7", "სტრიქონი, სადაც კვირის თარიღებია."),
    (14, "პირველი კვირის სვეტი", "first_week_column", "J", "სვეტი, საიდანაც პირველი კვირის მონაცემი იწყება."),
    (15, "პირველი კვირის ნომერი", "first_week_number", "44", "გრაფიკის პირველი კვირის ნომერი."),
    (16, "კვირების რაოდენობა", "week_count", "37", "კვირის სვეტების რაოდენობა."),
    (17, "გაკვეთილები დღეში", "lessons_per_day", "8", "დღეში გაკვეთილების სტრიქონების რაოდენობა."),
    (18, "სასწავლო დღეები", "learning_days", "ორშაბათი, სამშაბათი, ოთხშაბათი, ხუთშაბათი, პარასკევი, შაბათი, კვირა", "სასწავლო დღეები მძიმით გამოყავი."),
    (19, "სათაური", "title", "სასწავლო კვირა", "გრაფიკის დიდი სათაური."),
    (20, "ქვესათაური", "subtitle", "2026-2027 წლის ცხრილი", "სათაურის ქვეშ გამოსატანი ტექსტი."),
    (21, "შრიფტი", "font", "Sylfaen", "ქართულისთვის შესაფერისი შრიფტი."),
]
DEFAULT_PARAMETERS = {key: value for _, _, key, value, _ in PARAMETERS}
PARAMETER_LABEL_TO_KEY = {label.strip().casefold(): key for _, label, key, _, _ in PARAMETERS}
WEEKDAY_INDEX = {
    "ორშაბათი": 0,
    "სამშაბათი": 1,
    "ოთხშაბათი": 2,
    "ხუთშაბათი": 3,
    "პარასკევი": 4,
    "შაბათი": 5,
    "კვირა": 6,
}

# Persistent database values. The UI continues to use readable names.
MODULE_TYPE_IDS = {"professional": 1, "general": 2, "integrated_general": 3}
MODULE_TYPE_NAMES = {code: name for name, code in MODULE_TYPE_IDS.items()}


def module_type_id(value):
    if isinstance(value, bool):
        raise ValueError("მოდულის ტიპი არასწორია.")
    if value in MODULE_TYPE_IDS:
        return MODULE_TYPE_IDS[value]
    if str(value) in {"1", "2", "3"}:
        return int(value)
    raise ValueError("მოდულის ტიპი უნდა იყოს 1, 2 ან 3.")


def module_type_name(value):
    return MODULE_TYPE_NAMES[module_type_id(value)]
