import json
from datetime import date
from typing import Literal
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field, model_validator, field_validator
from database import connect
from calendar_rules import build_calendar
from plan_breaks import effective_breaks

router=APIRouter(prefix='/api/days-off')

def missing():raise HTTPException(404,'ჩანაწერი ვერ მოიძებნა.')

def ok(**data):return {'authenticated':True,'ok':True,**data}

class Entry(BaseModel):
    title:str=Field(min_length=1,max_length=200)
    kind:Literal['holiday','vacation']
    scope:Literal['all','integrated','non_integrated']
    start_date:date
    end_date:date
    annual:bool=False
    @field_validator('title')
    @classmethod
    def title_nonempty(cls,v):
        if not v.strip():raise ValueError('შეავსეთ დასახელება.')
        return v.strip()
    @model_validator(mode='after')
    def valid(self):
        if self.end_date<self.start_date:raise ValueError('თარიღების რიგი არასწორია.')
        if self.kind=='holiday' and self.scope!='all':raise ValueError('საერთო უქმე დღე ორივე ტიპზე ვრცელდება.')
        if self.kind=='vacation' and (self.scope=='all' or self.annual):raise ValueError('არდადეგებს მიუთითეთ პროგრამის ტიპი და კონკრეტული თარიღები.')
        if self.annual and self.start_date!=self.end_date:raise ValueError('ყოველწლიურ უქმეს ერთი თარიღი უნდა ჰქონდეს.')
        return self

class SchoolYear(BaseModel):
    academic_year:str=Field(min_length=1,max_length=40)
    start_date:date
    @field_validator('academic_year')
    @classmethod
    def nonempty(cls,v):
        if not v.strip():raise ValueError('შეავსეთ სასწავლო წელი.')
        return v.strip()

class Config(BaseModel):
    compensation_mode:Literal['saturday','extend']
    start_date:date
    end_date:date
    occupied_saturdays:list[date]=Field(default_factory=list,max_length=300)
    @model_validator(mode='after')
    def valid(self):
        if not 0<=(self.end_date-self.start_date).days<=1830:raise ValueError('კალენდრის პერიოდი უნდა იყოს მაქსიმუმ ხუთი წელი.')
        if any(d.weekday()!=5 for d in self.occupied_saturdays):raise ValueError('დაკავებულ დღეებში მიუთითეთ მხოლოდ შაბათები.')
        self.occupied_saturdays=sorted(set(self.occupied_saturdays))
        return self

@router.post('/list')
def listing(request:Request):
    db=connect()
    try:
        with db.cursor() as c:
            c.execute('SELECT * FROM ci_days_off WHERE owner_id=%s ORDER BY start_date,id',(request.state.user_id,));entries=c.fetchall()
            c.execute('SELECT academic_year,start_date FROM ci_school_years WHERE owner_id=%s ORDER BY academic_year',(request.state.user_id,));years=c.fetchall()
        return ok(entries=entries,school_years=years)
    finally:db.close()

def write_entry(body,request,entry_id=None):
    db=connect()
    try:
        with db.cursor() as c:
            args=(body.title,body.kind,body.scope,body.start_date,body.end_date,int(body.annual))
            if entry_id is None:
                c.execute('SELECT COUNT(*) AS n FROM ci_days_off WHERE owner_id=%s',(request.state.user_id,))
                if c.fetchone()['n']>=3000:raise HTTPException(400,'ჩანაწერების ზღვარი მიღწეულია.')
                c.execute('INSERT INTO ci_days_off(title,kind,scope,start_date,end_date,annual,owner_id) VALUES (%s,%s,%s,%s,%s,%s,%s)',args+(request.state.user_id,));entry_id=c.lastrowid
            else:
                c.execute('SELECT id FROM ci_days_off WHERE id=%s AND owner_id=%s FOR UPDATE',(entry_id,request.state.user_id))
                if not c.fetchone():missing()
                c.execute('UPDATE ci_days_off SET title=%s,kind=%s,scope=%s,start_date=%s,end_date=%s,annual=%s WHERE id=%s AND owner_id=%s',args+(entry_id,request.state.user_id))
        db.commit();return ok(id=entry_id)
    except Exception:db.rollback();raise
    finally:db.close()

@router.post('/entries')
def create(body:Entry,request:Request):return write_entry(body,request)
@router.put('/entries/{entry_id}')
def update(entry_id:int,body:Entry,request:Request):return write_entry(body,request,entry_id)
@router.delete('/entries/{entry_id}')
def remove(entry_id:int,request:Request):
    db=connect()
    try:
        with db.cursor() as c:
            c.execute('DELETE FROM ci_days_off WHERE id=%s AND owner_id=%s',(entry_id,request.state.user_id))
            if c.rowcount!=1:missing()
        db.commit();return ok()
    except Exception:db.rollback();raise
    finally:db.close()

@router.post('/school-year')
def school_year(body:SchoolYear,request:Request):
    db=connect()
    try:
        with db.cursor() as c:
            c.execute('INSERT INTO ci_school_years(owner_id,academic_year,start_date) VALUES (%s,%s,%s) ON DUPLICATE KEY UPDATE start_date=VALUES(start_date)',(request.state.user_id,body.academic_year,body.start_date))
        db.commit();return ok()
    except Exception:db.rollback();raise
    finally:db.close()

def owned_plan(c,plan_id,owner):
    c.execute('SELECT id,academic_year,program_type,start_date FROM ci_plans WHERE id=%s AND owner_id=%s',(plan_id,owner))
    plan=c.fetchone()
    if not plan:missing()
    return plan

def validate_start(c,plan,body,owner):
    if plan['program_type']=='integrated':
        c.execute('SELECT start_date FROM ci_school_years WHERE owner_id=%s AND academic_year=%s',(owner,plan['academic_year']))
        school=c.fetchone()
        if not school:raise HTTPException(400,'ჯერ მიუთითეთ სკოლის სწავლის დაწყება ამ სასწავლო წლისთვის.')
        if body.start_date!=school['start_date']:raise HTTPException(400,'ინტეგრირებული გეგმის დაწყება უნდა ემთხვეოდეს სკოლის კალენდარს.')

@router.get('/plans/{plan_id}')
def config(plan_id:int,request:Request):
    db=connect()
    try:
        with db.cursor() as c:
            plan=owned_plan(c,plan_id,request.state.user_id)
            c.execute('SELECT compensation_mode,start_date,end_date,occupied_saturdays FROM ci_calendar_settings WHERE plan_id=%s AND owner_id=%s',(plan_id,request.state.user_id));setting=c.fetchone()
            if setting:setting['occupied_saturdays']=json.loads(setting['occupied_saturdays'])
        return ok(plan=plan,settings=setting)
    finally:db.close()

@router.put('/plans/{plan_id}')
def save_config(plan_id:int,body:Config,request:Request):
    db=connect()
    try:
        with db.cursor() as c:
            # Lock parent to serialize with plan deletion.
            c.execute('SELECT id FROM ci_plans WHERE id=%s AND owner_id=%s FOR UPDATE',(plan_id,request.state.user_id))
            if not c.fetchone():missing()
            plan=owned_plan(c,plan_id,request.state.user_id);validate_start(c,plan,body,request.state.user_id)
            c.execute('INSERT INTO ci_calendar_settings(plan_id,owner_id,compensation_mode,start_date,end_date,occupied_saturdays) VALUES (%s,%s,%s,%s,%s,%s) ON DUPLICATE KEY UPDATE compensation_mode=VALUES(compensation_mode),start_date=VALUES(start_date),end_date=VALUES(end_date),occupied_saturdays=VALUES(occupied_saturdays)',(plan_id,request.state.user_id,body.compensation_mode,body.start_date,body.end_date,json.dumps([str(d) for d in body.occupied_saturdays])))
        db.commit();return ok()
    except Exception:db.rollback();raise
    finally:db.close()

@router.post('/plans/{plan_id}/preview')
def preview(plan_id:int,body:Config,request:Request):
    db=connect()
    try:
        with db.cursor() as c:
            plan=owned_plan(c,plan_id,request.state.user_id);validate_start(c,plan,body,request.state.user_id)
            c.execute('SELECT * FROM ci_days_off WHERE owner_id=%s',(request.state.user_id,));entries=c.fetchall()
            entries+=effective_breaks(c,plan_id,request.state.user_id,body.start_date,body.end_date,plan['program_type'])
        try:result=build_calendar(body.start_date,body.end_date,plan['program_type'],body.compensation_mode,entries,body.occupied_saturdays)
        except ValueError as e:raise HTTPException(400,str(e))
        return ok(calendar=result)
    finally:db.close()
