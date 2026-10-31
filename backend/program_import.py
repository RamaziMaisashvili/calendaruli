import hashlib
import json
import math
import zipfile
from datetime import date
from io import BytesIO
from pathlib import Path
from typing import Literal
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field, field_validator, model_validator
from openpyxl import load_workbook
from openpyxl.utils import column_index_from_string
from database import connect
from curriculum_parameters import DEFAULT_PARAMETERS
from workbook_profiles import detect as detect_profile, extract as extract_auto
from excel_parser import _parameter_values, _validated_settings, _extract_modules, _program_title

router = APIRouter(prefix='/api/program-import')
MAX_UPLOAD=200*1024*1024
MAX_UNPACKED=1024*1024*1024


def bad(message):
    raise HTTPException(400,message)


def workbook_from(raw, filename):
    if Path(filename).suffix.lower() not in ('.xlsx','.xlsm'):
        bad('აირჩიეთ Excel ფაილი .xlsx ან .xlsm ფორმატში.')
    if not raw or len(raw)>MAX_UPLOAD:
        bad('ფაილი ცარიელია ან აღემატება 200 მბ-ს.')
    try:
        with zipfile.ZipFile(BytesIO(raw)) as archive:
            members=archive.infolist()
            if len(members)>3000 or sum(x.file_size for x in members)>MAX_UNPACKED:
                bad('ფაილის შიგთავსი დასაშვებ ზომას აღემატება.')
            if any(x.flag_bits & 1 for x in members):
                bad('პაროლით დაცული ფაილი არ მიიღება.')
        return load_workbook(BytesIO(raw),data_only=True,read_only=False,keep_links=False)
    except HTTPException:
        raise
    except Exception:
        bad('Excel ფაილი ვერ წაიკითხა. გადაამოწმეთ ფაილის ფორმატი.')


async def read_upload(file):
    raw=await file.read(MAX_UPLOAD+1)
    await file.close()
    return raw


@router.post('/inspect')
async def inspect(file: UploadFile=File(...)):
    raw=await read_upload(file)
    wb=workbook_from(raw,file.filename or '')
    try:
        defaults=_parameter_values(wb)
        sheet=defaults['sheet_name'] if defaults['sheet_name'] in wb.sheetnames else ('ძირითადი' if 'ძირითადი' in wb.sheetnames else wb.sheetnames[0])
        defaults['sheet_name']=sheet
        return {'authenticated':True,'ok':True,'sheets':wb.sheetnames,'settings':defaults,
                'suggested_name':_program_title(wb,sheet,file.filename or 'პროგრამა'),
                'filename':Path(file.filename or '').name,'auto_sheets':[name for name in wb.sheetnames if detect_profile(wb[name])]}
    finally:
        wb.close()


@router.post('/preview')
async def preview(file: UploadFile=File(...),settings: str=Form(...),program_type: str=Form(...)):
    if len(settings)>20000:
        bad('პარამეტრების ზომა დასაშვებ ზღვარს აღემატება.')
    try:
        values=json.loads(settings)
        if not isinstance(values,dict):raise ValueError()
    except (ValueError,TypeError):
        bad('ფაილის წაკითხვის პარამეტრები არასწორია.')
    raw=await read_upload(file)
    wb=workbook_from(raw,file.filename or '')
    try:
        if values.get('sheet_name') not in wb.sheetnames:
            bad('არჩეული ფურცელი არ არსებობს.')
        auto=values.get('plan_format')=='auto'
        if auto:
            modules,checked,auto_warnings=extract_auto(wb,values['sheet_name'])
        else:
            checked=_validated_settings(values,wb.sheetnames,program_type)
            for key in ['total_column','contact_column','independent_column','assessment_column','module_name_column','first_week_column']:
                if key=='assessment_column' and checked.get('plan_format')=='a':continue
                if column_index_from_string(checked[key].upper())>16384:bad('სვეტი Excel-ის ფარგლებს სცდება.')
            if column_index_from_string(checked['first_week_column'].upper())+checked['week_count']-1>16384:
                bad('კვირების სვეტები Excel-ის ფარგლებს სცდება.')
            modules=_extract_modules(wb,checked)
        warnings=auto_warnings if auto else []
        for module in modules:
            if module['module_type']=='integrated_general':
                for key in ('independent','assessment'):
                    if module[key] is None:module[key]=0
            for key in ['total','contact','independent','assessment']:
                value=module[key]
                if value is not None and (not math.isfinite(value) or value<0):
                    bad(f"სტრიქონი {module['source_row']}: საათები უნდა იყოს არაუარყოფითი რიცხვი.")
            for week in module['weekly']:
                value=week['hours']
                if value is not None and (not math.isfinite(value) or value<0):bad('კვირის საათები არასწორია.')
                if value is None:week['hours']=0
            if any(module[k] is None for k in ['total','contact','independent','assessment']):
                warnings.append(f"სტრიქონი {module['source_row']}: ცარიელი საათების ველები შეავსეთ შენახვამდე.")
        plain={k:v for k,v in checked.items() if k!='module_type_by_row'}
        return {'authenticated':True,'ok':True,'modules':modules,'settings':plain,'warnings':warnings,
                'filename':Path(file.filename or '').name,'file_hash':hashlib.sha256(raw).hexdigest()}
    except ValueError as exc:
        bad(str(exc))
    finally:
        wb.close()


class Week(BaseModel):
    week: str | int | float = Field(default='')
    date: str | int | float | None = None
    total: float | None = Field(default=None,ge=0,le=1000000,allow_inf_nan=False)
    independent: float | None = Field(default=None,ge=0,le=1000000,allow_inf_nan=False)
    hours: float = Field(ge=0,le=1000000,allow_inf_nan=False)


    @field_validator('hours',mode='before')
    @classmethod
    def blank_zero(cls,value):
        return 0 if value is None or value=='' else value

    @field_validator('hours','total','independent')
    @classmethod
    def precise_hours(cls,value):
        if value is not None and abs(value*100-round(value*100))>0.000001:
            raise ValueError('საათებს მაქსიმუმ ორი ათწილადი უნდა ჰქონდეს.')
        return value


class Module(BaseModel):
    source_row: int=Field(ge=1,le=10000)
    name: str=Field(min_length=1,max_length=500)
    code: str=Field(default='',max_length=64)
    module_type: Literal['professional','general','integrated_general']
    total: float=Field(ge=0,le=1000000,allow_inf_nan=False)
    contact: float=Field(ge=0,le=1000000,allow_inf_nan=False)
    independent: float=Field(ge=0,le=1000000,allow_inf_nan=False)
    assessment: float=Field(ge=0,le=1000000,allow_inf_nan=False)
    weekly: list[Week]=Field(min_length=1,max_length=200)

    @model_validator(mode='before')
    @classmethod
    def integrated_hours(cls,value):
        if isinstance(value,dict) and value.get('module_type')=='integrated_general':
            value=dict(value)
            for key in ('independent','assessment'):
                if value.get(key) in (None,''):value[key]=0
        return value

    @field_validator('total','contact','independent','assessment')
    @classmethod
    def precise_hours(cls,value):
        if abs(value*100-round(value*100))>0.000001:
            raise ValueError('საათებს მაქსიმუმ ორი ათწილადი უნდა ჰქონდეს.')
        return value

    @field_validator('name')
    @classmethod
    def trim_name(cls,value):
        if not value.strip():raise ValueError('მოდულის სახელი ცარიელია.')
        return value.strip()


class SavePayload(BaseModel):
    program_name: str=Field(min_length=1,max_length=500)
    academic_year: str=Field(min_length=1,max_length=40)
    program_type: Literal['integrated','non_integrated']
    start_date: date
    source_filename: str=Field(min_length=1,max_length=255)
    settings: dict
    modules: list[Module]=Field(min_length=1,max_length=2000)


@router.post('/save')
def save(body: SavePayload,request: Request):
    return persist(body,request)


def persist(body,request,edit_id=None):
    owner=int(request.state.user_id)
    name=body.program_name.strip();year=body.academic_year.strip()
    if not name or not year:bad('შეავსეთ პროგრამის სახელი და სასწავლო წელი.')
    if body.program_type not in ('integrated','non_integrated'):bad('პროგრამის ტიპი არასწორია.')
    count=len(body.modules[0].weekly)
    seen=set();rows=set()
    for module in body.modules:
        identity=(module.name.casefold(),module.code.strip())
        if identity in seen or module.source_row in rows:bad('მოდული ან საწყისი სტრიქონი მეორდება.')
        seen.add(identity);rows.add(module.source_row)
        if module.module_type=='integrated_general' and body.program_type!='integrated':bad('მოდულის კატეგორია პროგრამის ტიპს არ შეესაბამება.')
        if len(module.weekly)!=count:bad('მოდულების კვირების რაოდენობა განსხვავდება.')
        for week in module.weekly:
            if len(str(week.week))>100 or (week.date is not None and len(str(week.date))>200):bad('კვირის ნომერი ან თარიღი ზედმეტად გრძელია.')
    fmt=body.settings.get('plan_format','legacy')
    if fmt not in ('a','b','legacy','auto'):bad('გეგმის ფორმატი არასწორია.')
    if fmt not in ('legacy','auto'):
        for module in body.modules:
            expected=module.contact+(module.assessment if fmt=='b' else 0)
            if fmt=='a' and module.assessment!=0:bad('ა ფორმატში შეფასება ცალკე არ უნდა იყოს.')
            if abs(module.total-expected-module.independent)>0.011:bad(f'{module.name}: სულ საათები არ ემთხვევა შემადგენელი საათების ჯამს.')
            for week in module.weekly:
                if week.independent is None or week.total is None:bad('კვირის საკონტაქტო, დამოუკიდებელი და სულ საათები უნდა იყოს შევსებული.')
                if abs(week.total-week.hours-week.independent)>0.011:bad(f'{module.name}: კვირაში სულ = საკონტაქტო + დამოუკიდებელი.')
            if abs(sum(w.hours for w in module.weekly)-expected)>0.011:bad(f'{module.name}: კვირეული საკონტაქტოს ჯამი არ ემთხვევა ჯამურ საკონტაქტოს'+(' და შეფასებას.' if fmt=='b' else '.'))
            if abs(sum(w.independent for w in module.weekly)-module.independent)>0.011:bad(f'{module.name}: კვირეული დამოუკიდებელი საათების ჯამი არ ემთხვევა ჯამურ დამოუკიდებელს.')
    # Store extra weekly components in the existing plan JSON; no schema change.
    body.settings=dict(body.settings)
    body.settings.pop('_weekly_components',None)
    body.settings.pop('_weekly_version',None)
    if fmt!='legacy':
        body.settings['_weekly_version']=1
        body.settings['_weekly_components']=[[{'total':w.total,'independent':w.independent} for w in m.weekly] for m in body.modules]
    data=body.model_dump(mode='json')
    if len(json.dumps(data,ensure_ascii=False))>8*1024*1024:bad('მონაცემები დასაშვებ ზომას აღემატება.')
    # Stable fingerprint avoids duplicate inserts after retries or repeated clicks.
    canonical=dict(data);canonical.pop('source_filename',None)
    canonical['program_name']=name;canonical['academic_year']=year
    fingerprint=hashlib.sha256(json.dumps(canonical,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
    name_key=hashlib.sha256(name.casefold().encode()).hexdigest()
    db=connect()
    try:
        with db.cursor() as cur:
            if edit_id is not None:
                cur.execute('SELECT id FROM ci_plans WHERE id=%s AND owner_id=%s FOR UPDATE',(edit_id,owner))
                if not cur.fetchone():raise HTTPException(404,'გეგმა ვერ მოიძებნა.')
            cur.execute('SELECT id FROM ci_plans WHERE owner_id=%s AND content_hash=%s',(owner,fingerprint))
            previous=cur.fetchone()
            if previous and edit_id is not None and previous['id']!=edit_id:raise HTTPException(409,'ასეთი გეგმა უკვე არსებობს.')
            if previous and edit_id is None:return {'authenticated':True,'ok':True,'plan_id':previous['id'],'already_saved':True,'message':'ეს მონაცემები უკვე შენახულია.'}
            cur.execute('INSERT INTO ci_programs(owner_id,name,name_key) VALUES (%s,%s,%s) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',(owner,name,name_key))
            program_id=cur.lastrowid
            if edit_id is None:
                cur.execute('INSERT INTO ci_plans(owner_id,program_id,academic_year,program_type,start_date,source_filename,content_hash,settings_json) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',
                            (owner,program_id,year,body.program_type,body.start_date,body.source_filename,fingerprint,json.dumps(body.settings,ensure_ascii=False)))
                plan_id=cur.lastrowid
            else:
                plan_id=edit_id
                cur.execute('UPDATE ci_plans SET program_id=%s,academic_year=%s,program_type=%s,start_date=%s,source_filename=%s,content_hash=%s,settings_json=%s WHERE id=%s AND owner_id=%s',(program_id,year,body.program_type,body.start_date,body.source_filename,fingerprint,json.dumps(body.settings,ensure_ascii=False),edit_id,owner))
                cur.execute('DELETE FROM ci_modules WHERE plan_id=%s',(edit_id,))
            for i,module in enumerate(body.modules,1):
                cur.execute('INSERT INTO ci_modules(plan_id,module_order,source_row,name,code,module_type,total_hours,contact_hours,independent_hours,assessment_hours) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)',
                            (plan_id,i,module.source_row,module.name,module.code.strip(),module.module_type,module.total,module.contact,module.independent,module.assessment))
                module_id=cur.lastrowid
                cur.executemany('INSERT INTO ci_week_hours(module_id,week_order,week_label,date_label,hours) VALUES (%s,%s,%s,%s,%s)',
                                [(module_id,j,str(w.week),None if w.date is None else str(w.date),w.hours) for j,w in enumerate(module.weekly,1)])
        db.commit()
        return {'authenticated':True,'ok':True,'plan_id':plan_id,'already_saved':False,'message':'ცვლილებები შენახულია.' if edit_id is not None else 'პროგრამა და სასწავლო გეგმა შენახულია.'}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@router.post('/list')
def list_programs(request: Request):
    db=connect()
    try:
        with db.cursor() as cur:
            cur.execute('''SELECT sp.id, p.name AS program_name, sp.academic_year, sp.program_type,
                sp.start_date,sp.created_at,COUNT(m.id) AS module_count
                FROM ci_plans sp JOIN ci_programs p ON p.id=sp.program_id
                LEFT JOIN ci_modules m ON m.plan_id=sp.id
                WHERE sp.owner_id=%s AND p.owner_id=%s
                GROUP BY sp.id,p.name,sp.academic_year,sp.program_type,sp.start_date,sp.created_at
                ORDER BY sp.id DESC LIMIT 100''',(request.state.user_id,request.state.user_id))
            items=cur.fetchall()
        return {'authenticated':True,'ok':True,'items':items}
    finally:
        db.close()


@router.get('/{plan_id}')
def detail(plan_id:int,request:Request):
    db=connect()
    try:
        with db.cursor() as cur:
            cur.execute('SELECT sp.*,p.name AS program_name FROM ci_plans sp JOIN ci_programs p ON p.id=sp.program_id WHERE sp.id=%s AND sp.owner_id=%s AND p.owner_id=%s',(plan_id,request.state.user_id,request.state.user_id))
            plan=cur.fetchone()
            if not plan:raise HTTPException(404,'გეგმა ვერ მოიძებნა.')
            cur.execute('SELECT * FROM ci_modules WHERE plan_id=%s ORDER BY module_order',(plan_id,))
            modules=cur.fetchall()
            for module in modules:
                cur.execute('SELECT week_label AS week,date_label AS date,hours FROM ci_week_hours WHERE module_id=%s ORDER BY week_order',(module['id'],))
                module['weekly']=cur.fetchall()
                for key in ('total','contact','independent','assessment'):module[key]=module.pop(key+'_hours')
            settings=json.loads(plan['settings_json'])
            details=settings.pop('_weekly_components',None)
            if details is not None:
                for module,components in zip(modules,details):
                    for week,extra in zip(module['weekly'],components):week.update(extra)
            return {'authenticated':True,'ok':True,'plan':{'program_name':plan['program_name'],'academic_year':plan['academic_year'],'program_type':plan['program_type'],'start_date':plan['start_date'],'source_filename':plan['source_filename'],'settings':settings,'modules':modules}}
    finally:db.close()


@router.put('/{plan_id}')
def update(plan_id:int,body:SavePayload,request:Request):
    return persist(body,request,plan_id)


@router.delete('/{plan_id}')
def delete(plan_id:int,request:Request):
    db=connect()
    try:
        with db.cursor() as cur:
            cur.execute('DELETE FROM ci_plans WHERE id=%s AND owner_id=%s',(plan_id,request.state.user_id))
            if cur.rowcount!=1:raise HTTPException(404,'გეგმა ვერ მოიძებნა.')
        db.commit()
        return {'authenticated':True,'ok':True}
    except Exception:
        db.rollback()
        raise
    finally:db.close()
