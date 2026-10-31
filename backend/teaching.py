from datetime import datetime
from typing import Literal
import pymysql
from fastapi import APIRouter,HTTPException,Request
from pydantic import BaseModel,Field,field_validator,model_validator
from database import connect
from auth import hash_password
router=APIRouter(prefix='/api/teaching')

def result(**values):return {'authenticated':True,'ok':True,**values}
def fail(message,status=400):raise HTTPException(status,message)
def access(user_id):
    db=connect()
    try:
        with db.cursor() as c:
            c.execute('SELECT id,owner_id,first_name,last_name,deleted_at FROM ci_teachers WHERE user_id=%s',(user_id,));row=c.fetchone()
        if row:return {'role':'teacher','teacher_id':row['id'],'owner_id':row['owner_id'],'disabled':bool(row['deleted_at']),'name':row['first_name']+' '+row['last_name']}
        return {'role':'manager','owner_id':user_id}
    finally:db.close()
def session_access(user_id,data):
    if not user_id or not data.get('authenticated'):return data
    role=access(user_id)
    return {**data,'role':role['role'],'display_name':role.get('name','')}

def manager(req):
    a=req.state.access
    if a['role']!='manager':fail('ამ მოქმედების უფლება არ გაქვთ.',403)
    return a['owner_id']
def one(c,table,id,owner,extra=''):
    # Table identifiers are internal constants, never request input.
    c.execute(f'SELECT * FROM {table} WHERE id=%s AND owner_id=%s'+extra,(id,owner));r=c.fetchone()
    if not r:fail('ჩანაწერი ვერ მოიძებნა.',404)
    return r

def mutate(owner,fn):
    db=connect()
    try:
        with db.cursor() as c:
            # One owner lock serializes edits/deletes and overlap checks.
            c.execute('SELECT id FROM api_users WHERE id=%s FOR UPDATE',(owner,))
            if not c.fetchone():fail('ანგარიში ვერ მოიძებნა.',404)
            output=fn(c)
        db.commit();return result(**(output or {}))
    except pymysql.err.IntegrityError:
        db.rollback();fail('ჩანაწერი უკვე არსებობს ან დაკავშირებული მონაცემები ჯერ გამოიყენება.',409)
    except Exception:db.rollback();raise
    finally:db.close()
class Clean(BaseModel):
    @field_validator('*',mode='before')
    @classmethod
    def strip(cls,v,info):return v.strip() if isinstance(v,str) and info.field_name!='password' else v
class Teacher(Clean):
    first_name:str=Field(min_length=1,max_length=100)
    last_name:str=Field(min_length=1,max_length=100)
    phone:str=Field(default='',max_length=50)
    email:str=Field(default='',max_length=190)
    username:str=Field(min_length=1,max_length=190)
    password:str=Field(default='',max_length=1024)
    @field_validator('password',mode='before')
    @classmethod
    def unchanged_password(cls,v):return v
    @model_validator(mode='after')
    def valid(self):
        if self.password and len(self.password)<4:raise ValueError('პაროლი მინიმუმ 4 სიმბოლო უნდა იყოს.')
        return self
class Group(Clean):
    name:str=Field(min_length=1,max_length=190)
    student_count:int=Field(ge=1,le=10000)
    plan_id:int=Field(gt=0)
class Room(Clean):
    name:str=Field(min_length=1,max_length=190)
    building:str=Field(default='',max_length=190)
    capacity:int=Field(ge=1,le=10000)
    room_type:str=Field(min_length=1,max_length=100)
class Assignment(BaseModel):
    group_id:int=Field(gt=0)
    module_id:int=Field(gt=0)
    teacher_id:int=Field(gt=0)
class Lesson(BaseModel):
    assignment_id:int=Field(gt=0)
    room_id:int=Field(gt=0)
    starts_at:datetime
    ends_at:datetime
    @model_validator(mode='after')
    def valid(self):
        if self.starts_at.tzinfo or self.ends_at.tzinfo:raise ValueError('გამოიყენეთ ადგილობრივი დრო, Asia/Tbilisi.')
        if self.starts_at>=self.ends_at or self.starts_at.date()!=self.ends_at.date():raise ValueError('გაკვეთილის დასაწყისი და დასრულება ერთი დღის სწორი საათები უნდა იყოს.')
        if self.starts_at.second or self.ends_at.second or self.starts_at.microsecond or self.ends_at.microsecond:raise ValueError('დრო მიუთითეთ წუთის სიზუსტით.')
        return self

@router.post('/list')
def listing(req:Request):
    owner=manager(req);db=connect()
    try:
        with db.cursor() as c:
            c.execute('SELECT t.id,t.first_name,t.last_name,t.phone,t.email,u.username FROM ci_teachers t JOIN api_users u ON u.id=t.user_id WHERE t.owner_id=%s AND t.deleted_at IS NULL ORDER BY t.last_name,t.first_name',(owner,));teachers=c.fetchall()
            c.execute('SELECT g.*,p.name AS program_name,sp.academic_year FROM ci_groups g JOIN ci_plans sp ON sp.id=g.plan_id JOIN ci_programs p ON p.id=sp.program_id WHERE g.owner_id=%s ORDER BY g.name',(owner,));groups=c.fetchall()
            c.execute('SELECT * FROM ci_rooms WHERE owner_id=%s ORDER BY building,name',(owner,));rooms=c.fetchall()
            c.execute('SELECT sp.id,p.name,sp.academic_year FROM ci_plans sp JOIN ci_programs p ON p.id=sp.program_id WHERE sp.owner_id=%s ORDER BY sp.id DESC',(owner,));plans=c.fetchall()
            c.execute('SELECT a.id,a.group_id,a.module_id,a.teacher_id,g.name AS group_name,m.name AS module_name,t.first_name,t.last_name FROM ci_assignments a JOIN ci_groups g ON g.id=a.group_id JOIN ci_modules m ON m.id=a.module_id JOIN ci_teachers t ON t.id=a.teacher_id WHERE a.owner_id=%s ORDER BY g.name,m.name',(owner,));assignments=c.fetchall()
        return result(teachers=teachers,groups=groups,rooms=rooms,plans=plans,assignments=assignments)
    finally:db.close()

@router.get('/plans/{plan_id}/modules')
def modules(plan_id:int,req:Request):
    owner=manager(req);db=connect()
    try:
        with db.cursor() as c:
            one(c,'ci_plans',plan_id,owner)
            c.execute('SELECT id,name,code FROM ci_modules WHERE plan_id=%s ORDER BY module_order',(plan_id,));rows=c.fetchall()
        return result(items=rows)
    finally:db.close()

def save_teacher(body,req,id=None):
    owner=manager(req)
    def write(c):
        if id is None:
            if not body.password:fail('მასწავლებლის ანგარიშისთვის მიუთითეთ პაროლი.')
            c.execute('INSERT INTO api_users(username,name,password_hash) VALUES (%s,%s,%s)',(body.username,(body.first_name+' '+body.last_name)[:190],hash_password(body.password)))
            uid=c.lastrowid
            c.execute('INSERT INTO ci_teachers(owner_id,user_id,first_name,last_name,phone,email) VALUES (%s,%s,%s,%s,%s,%s)',(owner,uid,body.first_name,body.last_name,body.phone,body.email));tid=c.lastrowid
        else:
            old=one(c,'ci_teachers',id,owner,' AND deleted_at IS NULL');uid=old['user_id'];tid=id
            c.execute('SELECT username FROM api_users WHERE id=%s',(uid,));old_username=c.fetchone()['username']
            c.execute('UPDATE api_users SET username=%s,name=%s WHERE id=%s',(body.username,(body.first_name+' '+body.last_name)[:190],uid))
            if body.password:
                c.execute('UPDATE api_users SET password_hash=%s,failed_attempts=0,locked_until=NULL WHERE id=%s',(hash_password(body.password),uid))
            if body.password or body.username!=old_username:
                c.execute('UPDATE api_token_sessions SET revoked_at=%s WHERE user_id=%s',(datetime.utcnow(),uid))
            c.execute('UPDATE ci_teachers SET first_name=%s,last_name=%s,phone=%s,email=%s WHERE id=%s',(body.first_name,body.last_name,body.phone,body.email,id))
        return {'id':tid}
    return mutate(owner,write)
@router.post('/teachers')
def create_teacher(body:Teacher,req:Request):return save_teacher(body,req)
@router.put('/teachers/{id}')
def update_teacher(id:int,body:Teacher,req:Request):return save_teacher(body,req,id)
@router.delete('/teachers/{id}')
def delete_teacher(id:int,req:Request):
    owner=manager(req)
    def write(c):
        old=one(c,'ci_teachers',id,owner,' AND deleted_at IS NULL')
        c.execute('SELECT id FROM ci_assignments WHERE teacher_id=%s LIMIT 1',(id,))
        if c.fetchone():fail('ჯერ წაშალეთ მასწავლებლის ჯგუფებთან და მოდულებთან კავშირები.',409)
        c.execute('UPDATE api_users SET is_active=0 WHERE id=%s',(old['user_id'],))
        c.execute('UPDATE api_token_sessions SET revoked_at=%s WHERE user_id=%s',(datetime.utcnow(),old['user_id']))
        c.execute('UPDATE ci_teachers SET deleted_at=%s WHERE id=%s',(datetime.utcnow(),id))
    return mutate(owner,write)

def save_group(body,req,id=None):
    owner=manager(req)
    def write(c):
        one(c,'ci_plans',body.plan_id,owner)
        if id is None:
            c.execute('INSERT INTO ci_groups(owner_id,plan_id,name,student_count) VALUES (%s,%s,%s,%s)',(owner,body.plan_id,body.name,body.student_count));return {'id':c.lastrowid}
        old=one(c,'ci_groups',id,owner)
        if old['plan_id']!=body.plan_id:
            c.execute('SELECT id FROM ci_assignments WHERE group_id=%s LIMIT 1',(id,))
            if c.fetchone():fail('გეგმის შეცვლამდე წაშალეთ ჯგუფის მოდულებთან არსებული კავშირები.',409)
        c.execute('SELECT r.capacity FROM ci_lessons l JOIN ci_assignments a ON a.id=l.assignment_id JOIN ci_rooms r ON r.id=l.room_id WHERE a.group_id=%s AND r.capacity<%s LIMIT 1',(id,body.student_count))
        if c.fetchone():fail('სტუდენტების ახალი რაოდენობა უკვე დანიშნული აუდიტორიის ტევადობას აღემატება.',409)
        c.execute('UPDATE ci_groups SET plan_id=%s,name=%s,student_count=%s WHERE id=%s',(body.plan_id,body.name,body.student_count,id));return {'id':id}
    return mutate(owner,write)
@router.post('/groups')
def create_group(body:Group,req:Request):return save_group(body,req)
@router.put('/groups/{id}')
def update_group(id:int,body:Group,req:Request):return save_group(body,req,id)
@router.delete('/groups/{id}')
def delete_group(id:int,req:Request):
    owner=manager(req)
    def write(c):
        one(c,'ci_groups',id,owner)
        c.execute('SELECT id FROM ci_assignments WHERE group_id=%s LIMIT 1',(id,))
        if c.fetchone():fail('ჯერ წაშალეთ ამ ჯგუფის მასწავლებლებთან და მოდულებთან კავშირები.',409)
        c.execute('DELETE FROM ci_groups WHERE id=%s',(id,))
    return mutate(owner,write)

def save_room(body,req,id=None):
    owner=manager(req)
    def write(c):
        if id is None:
            c.execute('INSERT INTO ci_rooms(owner_id,name,building,capacity,room_type) VALUES (%s,%s,%s,%s,%s)',(owner,body.name,body.building,body.capacity,body.room_type));return {'id':c.lastrowid}
        one(c,'ci_rooms',id,owner)
        c.execute('SELECT l.id FROM ci_lessons l JOIN ci_assignments a ON a.id=l.assignment_id JOIN ci_groups g ON g.id=a.group_id WHERE l.room_id=%s AND g.student_count>%s LIMIT 1',(id,body.capacity))
        if c.fetchone():fail('ახალი ტევადობა უკვე დანიშნული ჯგუფისთვის საკმარისი არ არის.',409)
        c.execute('UPDATE ci_rooms SET name=%s,building=%s,capacity=%s,room_type=%s WHERE id=%s',(body.name,body.building,body.capacity,body.room_type,id));return {'id':id}
    return mutate(owner,write)
@router.post('/rooms')
def create_room(body:Room,req:Request):return save_room(body,req)
@router.put('/rooms/{id}')
def update_room(id:int,body:Room,req:Request):return save_room(body,req,id)
@router.delete('/rooms/{id}')
def delete_room(id:int,req:Request):
    owner=manager(req)
    def write(c):
        one(c,'ci_rooms',id,owner)
        c.execute('SELECT id FROM ci_lessons WHERE room_id=%s LIMIT 1',(id,))
        if c.fetchone():fail('ჯერ გადაიტანეთ ან წაშალეთ ამ აუდიტორიაში დანიშნული გაკვეთილები.',409)
        c.execute('DELETE FROM ci_rooms WHERE id=%s',(id,))
    return mutate(owner,write)

@router.post('/assignments')
def create_assignment(body:Assignment,req:Request):
    owner=manager(req)
    def write(c):
        group=one(c,'ci_groups',body.group_id,owner)
        one(c,'ci_teachers',body.teacher_id,owner,' AND deleted_at IS NULL')
        c.execute('SELECT id FROM ci_modules WHERE id=%s AND plan_id=%s',(body.module_id,group['plan_id']))
        if not c.fetchone():fail('მოდული არჩეული ჯგუფის სასწავლო გეგმას არ ეკუთვნის.')
        c.execute('INSERT INTO ci_assignments(owner_id,group_id,module_id,teacher_id) VALUES (%s,%s,%s,%s)',(owner,body.group_id,body.module_id,body.teacher_id));return {'id':c.lastrowid}
    return mutate(owner,write)
@router.delete('/assignments/{id}')
def remove_assignment(id:int,req:Request):
    owner=manager(req)
    def write(c):
        one(c,'ci_assignments',id,owner)
        c.execute('SELECT id FROM ci_lessons WHERE assignment_id=%s LIMIT 1',(id,))
        if c.fetchone():fail('ჯერ წაშალეთ ან შეცვალეთ ამ კავშირის გაკვეთილები.',409)
        c.execute('DELETE FROM ci_assignments WHERE id=%s',(id,))
    return mutate(owner,write)

def save_lesson(body,req,id=None):
    owner=manager(req)
    def write(c):
        if id is not None:one(c,'ci_lessons',id,owner)
        a=one(c,'ci_assignments',body.assignment_id,owner)
        room=one(c,'ci_rooms',body.room_id,owner)
        group=one(c,'ci_groups',a['group_id'],owner)
        if room['capacity']<group['student_count']:fail('აუდიტორიის ადგილები ჯგუფისთვის საკმარისი არ არის.')
        c.execute('''SELECT l.id,a.teacher_id,a.group_id,l.room_id FROM ci_lessons l JOIN ci_assignments a ON a.id=l.assignment_id
          WHERE l.owner_id=%s AND l.id<>%s AND l.starts_at<%s AND l.ends_at>%s
          AND (a.teacher_id=%s OR a.group_id=%s OR l.room_id=%s) LIMIT 1''',(owner,id or 0,body.ends_at,body.starts_at,a['teacher_id'],a['group_id'],body.room_id))
        collision=c.fetchone()
        if collision:
            reason='მასწავლებელს' if collision['teacher_id']==a['teacher_id'] else 'ჯგუფს' if collision['group_id']==a['group_id'] else 'აუდიტორიას'
            fail(f'ამ დროს {reason} უკვე აქვს გაკვეთილი. აირჩიეთ სხვა დრო.',409)
        if id is None:
            c.execute('INSERT INTO ci_lessons(owner_id,assignment_id,room_id,starts_at,ends_at) VALUES (%s,%s,%s,%s,%s)',(owner,body.assignment_id,body.room_id,body.starts_at,body.ends_at));return {'id':c.lastrowid}
        c.execute('UPDATE ci_lessons SET assignment_id=%s,room_id=%s,starts_at=%s,ends_at=%s WHERE id=%s',(body.assignment_id,body.room_id,body.starts_at,body.ends_at,id));return {'id':id}
    return mutate(owner,write)
@router.post('/lessons')
def create_lesson(body:Lesson,req:Request):return save_lesson(body,req)
@router.put('/lessons/{id}')
def update_lesson(id:int,body:Lesson,req:Request):return save_lesson(body,req,id)
@router.delete('/lessons/{id}')
def remove_lesson(id:int,req:Request):
    owner=manager(req)
    def write(c):
        one(c,'ci_lessons',id,owner);c.execute('DELETE FROM ci_lessons WHERE id=%s',(id,))
    return mutate(owner,write)

class CalendarRange(BaseModel):
    start:datetime
    end:datetime
    @model_validator(mode='after')
    def valid(self):
        if self.start.tzinfo or self.end.tzinfo or not 0<(self.end-self.start).total_seconds()<=366*86400:raise ValueError('აირჩიეთ პერიოდი, მაქსიმუმ ერთი წელი.')
        return self
@router.post('/my-calendar')
def calendar(body:CalendarRange,req:Request):
    a=req.state.access;db=connect()
    try:
        with db.cursor() as c:
            sql='''SELECT l.id,l.assignment_id,l.room_id,l.starts_at,l.ends_at,g.name AS group_name,m.name AS module_name,
             t.first_name,t.last_name,r.name AS room_name,r.building FROM ci_lessons l JOIN ci_assignments x ON x.id=l.assignment_id
             JOIN ci_groups g ON g.id=x.group_id JOIN ci_modules m ON m.id=x.module_id JOIN ci_teachers t ON t.id=x.teacher_id
             JOIN ci_rooms r ON r.id=l.room_id WHERE l.owner_id=%s AND l.starts_at<%s AND l.ends_at>%s'''
            args=[a['owner_id'],body.end,body.start]
            if a['role']=='teacher':sql+=' AND x.teacher_id=%s';args.append(a['teacher_id'])
            c.execute(sql+' ORDER BY l.starts_at,l.id',tuple(args));rows=c.fetchall()
        return result(items=rows,role=a['role'])
    finally:db.close()
