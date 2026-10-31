import sys,sqlite3,tempfile,os,json
from datetime import date as D
sys.path[:0]=['auth_test_deps','import_release/api']
from calendar_rules import build_calendar
from days_off import Entry,Config
from fastapi.testclient import TestClient
import days_off,main

def entry(a,b=None,kind='holiday',scope='all',annual=False):
 return dict(title=kind,kind=kind,scope=scope,start_date=a,end_date=b or a,annual=annual)
# Mon Jan 5, 2026. A vacation covers an entire week; holiday weekdays compensate.
entries=[entry('2026-01-05'),entry('2026-01-10'),entry('2026-01-12','2026-01-18','vacation','integrated'),entry('2026-01-21')]
r=build_calendar(D(2026,1,5),D(2026,1,30),'integrated','saturday',entries,[D(2026,1,24)])
assert [w['number'] for w in r['weeks']]==[1,None,2,3]
assert r['makeups'][0]['date']==D(2026,1,31) # 10 holiday,17 vacation,24 occupied
assert r['makeups'][1]['date']==D(2026,2,7) # 31 reserved by earlier lost day
assert r['makeups'][1]['source_week']==2
assert r['missed_day_count']==2 and r['vacation_day_count']==5
assert r['study_week_count']==3
assert build_calendar(D(2026,1,5),D(2026,1,30),'integrated','extend',entries)['makeups']==[]
r=build_calendar(D(2026,1,12),D(2026,1,16),'non_integrated','extend',entries)
assert r['study_week_count']==1 and r['vacation_day_count']==0
r=build_calendar(D(2026,1,5),D(2026,1,9),'integrated','saturday',[entry('2026-01-05','2026-01-09')])
assert r['study_week_count']==0 and len(r['makeups'])==5 and len({m['date'] for m in r['makeups']})==5
assert all(m['source_week'] is None for m in r['makeups'])
r=build_calendar(D(2027,1,5),D(2027,1,5),'non_integrated','extend',[entry('2026-01-05',annual=True)])
assert r['missed_day_count']==1
r=build_calendar(D(2027,1,5),D(2027,1,5),'non_integrated','extend',[entry('2026-01-05')])
assert r['missed_day_count']==0
r=build_calendar(D(2026,1,5),D(2026,1,9),'integrated','saturday',[entry('2026-01-05'),entry('2026-01-05','2026-01-09','vacation','integrated')])
assert not r['makeups'] and r['vacation_day_count']==5
for data in [dict(compensation_mode='extend',start_date='2026-01-02',end_date='2026-01-01'),dict(compensation_mode='saturday',start_date='2026-01-01',end_date='2026-02-01',occupied_saturdays=['2026-01-05'])]:
 try:Config(**data);raise AssertionError('Invalid config accepted')
 except ValueError:pass
print('PASS rules: weekends, vacation precedence/type isolation, recurring/one-time dates, partial/full week numbering, reserved/holiday/vacation Saturday skips, queue collisions, spill past preview end, extend mode.')
fd,path=tempfile.mkstemp();os.close(fd)
db=sqlite3.connect(path)
db.executescript('''
CREATE TABLE ci_plans(id INTEGER PRIMARY KEY,owner_id INTEGER,academic_year TEXT,program_type TEXT,start_date DATE);
CREATE TABLE ci_days_off(id INTEGER PRIMARY KEY,owner_id INTEGER,title TEXT,kind TEXT,scope TEXT,start_date DATE,end_date DATE,annual INTEGER);
CREATE TABLE ci_school_years(id INTEGER PRIMARY KEY,owner_id INTEGER,academic_year TEXT,start_date DATE,UNIQUE(owner_id,academic_year));
CREATE TABLE ci_calendar_settings(plan_id INTEGER PRIMARY KEY REFERENCES ci_plans(id) ON DELETE CASCADE,owner_id INTEGER,compensation_mode TEXT,start_date DATE,end_date DATE,occupied_saturdays TEXT);
INSERT INTO ci_plans VALUES(1,1,'2026-2027','integrated','2026-09-15');
INSERT INTO ci_plans VALUES(2,1,'2026-2027','non_integrated','2026-09-15');
INSERT INTO ci_plans VALUES(3,2,'2026-2027','non_integrated','2026-09-15');
''');db.close()
class Cursor:
 def __init__(self,db):self.c=db.cursor()
 def __enter__(self):return self
 def __exit__(self,*a):pass
 @property
 def lastrowid(self):return self.c.lastrowid
 @property
 def rowcount(self):return self.c.rowcount
 def execute(self,q,args=()):
  q=q.replace('%s','?').replace(' FOR UPDATE','')
  if 'ON DUPLICATE KEY UPDATE' in q:
   head,tail=q.split(' ON DUPLICATE KEY UPDATE ')
   target='owner_id,academic_year' if 'ci_school_years' in q else 'plan_id'
   import re
   tail=re.sub(r'VALUES\((\w+)\)',r'excluded.\1',tail)
   q=head+f' ON CONFLICT({target}) DO UPDATE SET '+tail
  self.c.execute(q,args)
 def fetchone(self):
  r=self.c.fetchone();return dict(r) if r else None
 def fetchall(self):return [dict(r) for r in self.c.fetchall()]
class DB:
 def __init__(self):self.d=sqlite3.connect(path,detect_types=sqlite3.PARSE_DECLTYPES);self.d.row_factory=sqlite3.Row;self.d.execute('PRAGMA foreign_keys=ON')
 def cursor(self):return Cursor(self.d)
 def commit(self):self.d.commit()
 def rollback(self):self.d.rollback()
 def close(self):self.d.close()
days_off.connect=DB
main.validate_session=lambda req,**kw:(int(req.headers.get('X-Test-Owner','0')) or None,{'authenticated':bool(req.headers.get('X-Test-Owner'))})
c=TestClient(main.app);h={'X-Test-Owner':'1'};other={'X-Test-Owner':'2'}
assert c.post('/api/days-off/list').json()['authenticated'] is False
body=entry('2026-09-16');body['title']='ერთჯერადი უქმე'
r=c.post('/api/days-off/entries',headers=h,json=body);assert r.status_code==200,r.text
id=r.json()['id']
assert len(c.post('/api/days-off/list',headers=h).json()['entries'])==1
assert c.post('/api/days-off/list',headers=other).json()['entries']==[]
assert c.put(f'/api/days-off/entries/{id}',headers=other,json=body).status_code==404
assert c.delete(f'/api/days-off/entries/{id}',headers=other).status_code==404
r=c.put(f'/api/days-off/entries/{id}',headers=h,json=dict(body,title='შეცვლილი'));assert r.status_code==200
for bad in [dict(body,end_date='2026-09-10'),dict(body,scope='integrated'),dict(body,title=' '),dict(body,annual=True,end_date='2026-09-18')]:
 r=c.post('/api/days-off/entries',headers=h,json=bad);assert r.status_code==422 and r.json()['authenticated'],r.text
conf=dict(compensation_mode='saturday',start_date='2026-09-15',end_date='2026-09-30',occupied_saturdays=['2026-09-19'])
assert c.put('/api/days-off/plans/1',headers=h,json=conf).status_code==400
assert c.post('/api/days-off/school-year',headers=h,json={'academic_year':'2026-2027','start_date':'2026-09-15'}).status_code==200
assert c.put('/api/days-off/plans/1',headers=h,json=dict(conf,start_date='2026-09-14')).status_code==400
assert c.put('/api/days-off/plans/1',headers=h,json=conf).status_code==200
assert c.get('/api/days-off/plans/1',headers=h).json()['settings']['occupied_saturdays']==['2026-09-19']
assert c.put('/api/days-off/plans/1',headers=h,json=dict(conf,compensation_mode='extend')).status_code==200
r=c.post('/api/days-off/plans/1/preview',headers=h,json=conf);assert r.status_code==200,r.text
assert r.json()['calendar']['makeups'][0]['date']=='2026-09-26'
assert c.get('/api/days-off/plans/3',headers=h).status_code==404
assert c.put('/api/days-off/plans/3',headers=h,json=conf).status_code==404
assert c.post('/api/days-off/plans/3/preview',headers=h,json=conf).status_code==404
# Non-integrated may start on arbitrary dates without a school year record.
assert c.put('/api/days-off/plans/2',headers=h,json=dict(conf,start_date='2026-09-17')).status_code==200
# All methods pass browser preflights, including real requested auth headers.
for method in ('GET','POST','PUT','DELETE'):
 r=c.options('/api/days-off/entries/1',headers={'Origin':'https://calendar.learn.net.ge','Access-Control-Request-Method':method,'Access-Control-Request-Headers':'authorization,x-username,content-type'})
 assert r.status_code==200,(method,r.text)
assert c.delete(f'/api/days-off/entries/{id}',headers=h).status_code==200
assert c.post('/api/days-off/list',headers=h).json()['entries']==[]
x=sqlite3.connect(path);x.execute('PRAGMA foreign_keys=ON');x.execute('DELETE FROM ci_plans WHERE id=1');x.commit();assert x.execute('SELECT COUNT(*) FROM ci_calendar_settings WHERE plan_id=1').fetchone()[0]==0;x.close();os.unlink(path)
print('PASS API: authenticated CRUD, cross-owner protection, validation, school calendar enforcement, arbitrary non-integrated start, plan save/load/update, preview, cascade, GET/POST/PUT/DELETE preflights. SQLite adapter; live MySQL not tested.')
