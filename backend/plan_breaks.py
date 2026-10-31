"""Plan-specific, editable vacation templates and Easter dates supplied by user."""
from datetime import date,timedelta
from typing import Literal
from fastapi import APIRouter,Request,HTTPException,Query
from pydantic import BaseModel,Field,model_validator
from database import connect

router=APIRouter(prefix='/api/days-off')
EASTER={2023:'2023-04-16',2024:'2024-05-05',2025:'2025-04-20',2026:'2026-04-12',2027:'2027-05-02',2028:'2028-04-16',2029:'2029-04-08',2030:'2030-04-28',2031:'2031-04-13'}
TITLES={'winter':'საახალწლო არდადეგები','summer':'საზაფხულო არდადეგები','spring':'საგაზაფხულო არდადეგები','easter':'სააღდგომო უქმეები'}

def default_period(key,year):
    if key=='winter':return date(year-1,12,29),date(year,1,14)
    if key=='summer':return date(year,8,1),date(year,9,14)
    if key=='spring':return date(year,3,8),date(year,3,14)
    if year not in EASTER:return None,None
    sunday=date.fromisoformat(EASTER[year]);return sunday-timedelta(days=2),sunday+timedelta(days=1)

def owned(cursor,plan_id,owner,lock=False):
    cursor.execute('SELECT id FROM ci_plans WHERE id=%s AND owner_id=%s'+(' FOR UPDATE' if lock else ''),(plan_id,owner))
    if not cursor.fetchone():raise HTTPException(404,'გეგმა ვერ მოიძებნა.')

class Period(BaseModel):
    template_key:Literal['winter','summer','spring','easter']
    enabled:bool
    start_date:date | None=None
    end_date:date | None=None
    @model_validator(mode='after')
    def valid(self):
        if self.template_key=='easter' and not self.enabled:raise ValueError('სააღდგომო უქმეები სავალდებულოა.')
        if self.enabled:
            if not self.start_date or not self.end_date or not 0<=(self.end_date-self.start_date).days<=370:raise ValueError('მიუთითეთ სწორი დაწყება და დასრულება.')
            if self.template_key=='easter' and (self.end_date-self.start_date).days!=3:raise ValueError('სააღდგომო უქმეები ოთხ დღეს მოიცავს.')
        return self
class BreaksBody(BaseModel):
    year:int=Field(ge=1901,le=2198)
    periods:list[Period]=Field(min_length=4,max_length=4)
    @model_validator(mode='after')
    def valid(self):
        if {p.template_key for p in self.periods}!=set(TITLES):raise ValueError('ოთხივე პერიოდი უნდა იყოს მოცემული.')
        for p in self.periods:
            if p.enabled and not (self.year-1<=p.start_date.year<=self.year+1 and self.year-1<=p.end_date.year<=self.year+1):raise ValueError('თარიღები არჩეულ წელს უნდა შეესაბამებოდეს.')
        return self

@router.get('/plans/{plan_id}/breaks')
def listing(plan_id:int,request:Request,year:int=Query(ge=1901,le=2198)):
    db=connect()
    try:
        with db.cursor() as c:
            owned(c,plan_id,request.state.user_id)
            c.execute('SELECT template_key,enabled,start_date,end_date FROM ci_plan_breaks WHERE plan_id=%s AND owner_id=%s AND calendar_year=%s',(plan_id,request.state.user_id,year))
            saved={p['template_key']:p for p in c.fetchall()}
        items=[]
        for key,title in TITLES.items():
            a,b=default_period(key,year)
            value=saved.get(key,{'template_key':key,'enabled':key=='easter','start_date':a,'end_date':b})
            items.append({**value,'title':title,'default_start':a,'default_end':b,'saved':key in saved})
        return {'authenticated':True,'ok':True,'year':year,'periods':items,'easter_sunday':EASTER.get(year),'reference_source':'მომხმარებლის მიერ მოწოდებული თარიღები'}
    finally:db.close()

@router.put('/plans/{plan_id}/breaks')
def save(plan_id:int,body:BreaksBody,request:Request):
    db=connect()
    try:
        with db.cursor() as c:
            owned(c,plan_id,request.state.user_id,True)
            c.execute('DELETE FROM ci_plan_breaks WHERE plan_id=%s AND owner_id=%s AND calendar_year=%s',(plan_id,request.state.user_id,body.year))
            for p in body.periods:
                c.execute('INSERT INTO ci_plan_breaks(plan_id,owner_id,calendar_year,template_key,enabled,start_date,end_date) VALUES (%s,%s,%s,%s,%s,%s,%s)',(plan_id,request.state.user_id,body.year,p.template_key,int(p.enabled),p.start_date if p.enabled else None,p.end_date if p.enabled else None))
        db.commit();return {'authenticated':True,'ok':True}
    except Exception:db.rollback();raise
    finally:db.close()

def plan_rows(cursor,plan_id,owner):
    cursor.execute('SELECT calendar_year,template_key,enabled,start_date,end_date FROM ci_plan_breaks WHERE plan_id=%s AND owner_id=%s',(plan_id,owner))
    return cursor.fetchall()

def recurring_choices(rows):
    # Year 0 is the plan-wide selection; positive years retain date exceptions.
    stored={p['template_key']:bool(p['enabled']) for p in rows if p['calendar_year']==0}
    return {key:stored.get(key,any(p['template_key']==key and p['enabled'] for p in rows if p['calendar_year']>0)) for key in ('winter','summer','spring')}

def periods_for_range(rows,start,end,include_disabled=False,future_years=0):
    choices=recurring_choices(rows)
    overrides={(p['template_key'],p['calendar_year']):p for p in rows if p['calendar_year']>0 and p['enabled']}
    result=[]
    for year in range(start.year,end.year+2+future_years):
        for key in TITLES:
            enabled=key=='easter' or choices[key]
            if not enabled and not include_disabled:continue
            saved=overrides.get((key,year));a,b=default_period(key,year)
            if saved:a,b=saved['start_date'],saved['end_date']
            if a is None:
                if year<=end.year and key=='easter':
                    if include_disabled:
                        result.append({'template_key':key,'calendar_year':year,'title':TITLES[key],'enabled':True,'start_date':None,'end_date':None,'custom':False})
                        continue
                    raise HTTPException(400,f'{year} წლის სააღდგომო პერიოდი ჯერ შეიყვანეთ არჩეულ გეგმაში.')
                continue
            if a>end or b<start:
                if not future_years:continue
                if b<start:continue
            result.append({'template_key':key,'calendar_year':year,'title':TITLES[key],'enabled':enabled,'start_date':a,'end_date':b,'custom':bool(saved)})
    return result

def effective_breaks(cursor,plan_id,owner,start,end,program_type):
    rows=plan_rows(cursor,plan_id,owner)
    periods=periods_for_range(rows,start,end,future_years=10)
    result=[]
    for p in periods:
        key=p['template_key']
        if key=='easter':source='ამ გეგმის სააღდგომო ცვლილება' if p['custom'] else 'სააღდგომო წლების ცნობარი'
        else:source='ამ გეგმის არდადეგები — შეცვლილი თარიღები' if p['custom'] else 'ამ გეგმაში არჩეული ყოველწლიური არდადეგები'
        result.append({'title':p['title'],'kind':'holiday' if key=='easter' else 'vacation','scope':'all' if key=='easter' else program_type,'annual':False,'start_date':p['start_date'],'end_date':p['end_date'],'source':source})
    return result

class Occurrence(Period):
    calendar_year:int=Field(ge=1901,le=2198)
    @model_validator(mode='after')
    def year_valid(self):
        if self.enabled and not (self.calendar_year-1<=self.start_date.year<=self.calendar_year+1 and self.calendar_year-1<=self.end_date.year<=self.calendar_year+1):raise ValueError('თარიღები მითითებულ წელს უნდა შეესაბამებოდეს.')
        return self

class RecurringBody(BaseModel):
    selections:dict[Literal['winter','summer','spring'],bool]
    overrides:list[Occurrence]=Field(default_factory=list,max_length=40)
    @model_validator(mode='after')
    def valid(self):
        if set(self.selections)!= {'winter','summer','spring'}:raise ValueError('აირჩიეთ არდადეგების სამი სახე.')
        years=[(v.template_key,v.calendar_year) for v in self.overrides]
        if len(years)!=len(set(years)):raise ValueError('ერთი წელი მეორდება.')
        return self

@router.get('/plans/{plan_id}/recurring-breaks')
def recurring_listing(plan_id:int,request:Request,start_date:date,end_date:date):
    if not 0<=(end_date-start_date).days<=1830:raise HTTPException(400,'აირჩიეთ სწორი სასწავლო პერიოდი.')
    db=connect()
    try:
        with db.cursor() as c:
            owned(c,plan_id,request.state.user_id)
            rows=plan_rows(c,plan_id,request.state.user_id)
        return {'authenticated':True,'ok':True,'selections':recurring_choices(rows),'periods':periods_for_range(rows,start_date,end_date,True),'start_date':start_date,'end_date':end_date}
    finally:db.close()

@router.put('/plans/{plan_id}/recurring-breaks')
def recurring_save(plan_id:int,body:RecurringBody,request:Request):
    db=connect()
    try:
        with db.cursor() as c:
            owned(c,plan_id,request.state.user_id,True)
            c.execute('DELETE FROM ci_plan_breaks WHERE plan_id=%s AND owner_id=%s AND calendar_year=%s',(plan_id,request.state.user_id,0))
            for key,enabled in body.selections.items():
                c.execute('INSERT INTO ci_plan_breaks(plan_id,owner_id,calendar_year,template_key,enabled,start_date,end_date) VALUES (%s,%s,%s,%s,%s,%s,%s)',(plan_id,request.state.user_id,0,key,int(enabled),None,None))
            # Update only the explicitly edited occurrence, preserving other dates.
            for p in body.overrides:
                c.execute('DELETE FROM ci_plan_breaks WHERE plan_id=%s AND owner_id=%s AND calendar_year=%s AND template_key=%s',(plan_id,request.state.user_id,p.calendar_year,p.template_key))
                c.execute('INSERT INTO ci_plan_breaks(plan_id,owner_id,calendar_year,template_key,enabled,start_date,end_date) VALUES (%s,%s,%s,%s,%s,%s,%s)',(plan_id,request.state.user_id,p.calendar_year,p.template_key,int(p.enabled),p.start_date if p.enabled else None,p.end_date if p.enabled else None))
        db.commit();return {'authenticated':True,'ok':True}
    except Exception:db.rollback();raise
    finally:db.close()

@router.get('/plans/{plan_id}/effective-days-off')
def effective_listing(plan_id:int,request:Request,start_date:date,end_date:date):
    if not 0<=(end_date-start_date).days<=1830:raise HTTPException(400,'აირჩიეთ სწორი პერიოდი, მაქსიმუმ ხუთი წელი.')
    db=connect()
    try:
        with db.cursor() as c:
            c.execute('SELECT id,program_type FROM ci_plans WHERE id=%s AND owner_id=%s',(plan_id,request.state.user_id))
            plan=c.fetchone()
            if not plan:raise HTTPException(404,'გეგმა ვერ მოიძებნა.')
            c.execute('SELECT * FROM ci_days_off WHERE owner_id=%s',(request.state.user_id,))
            common=c.fetchall()
            custom=effective_breaks(c,plan_id,request.state.user_id,start_date,end_date,plan['program_type'])
        items=[]
        for entry in common:
            if entry['scope'] not in ('all',plan['program_type']):continue
            spans=[]
            if entry['annual']:
                for year in range(start_date.year,end_date.year+1):
                    try:spans.append((entry['start_date'].replace(year=year),entry['end_date'].replace(year=year)))
                    except ValueError:continue
            else:spans=[(entry['start_date'],entry['end_date'])]
            for a,b in spans:
                if a<=end_date and b>=start_date:items.append({'title':entry['title'],'kind':entry['kind'],'start_date':a,'end_date':b,'source':'საერთო' if entry['scope']=='all' else 'პროგრამის ტიპის მიხედვით','annual':bool(entry['annual'])})
        for entry in custom:
            if entry['start_date']<=end_date and entry['end_date']>=start_date:
                items.append({**{k:entry[k] for k in ('title','kind','start_date','end_date')},'source':entry.get('source','ამ გეგმაში არჩეული შაბლონი'),'annual':False})
        items.sort(key=lambda p:(p['start_date'],p['kind'],p['title']))
        return {'authenticated':True,'ok':True,'items':items,'start_date':start_date,'end_date':end_date,'note':'გადაფარვისას არდადეგებს უპირატესობა აქვს: მათში მოქცეული უქმე დღე არ ანაზღაურდება.'}
    finally:db.close()
