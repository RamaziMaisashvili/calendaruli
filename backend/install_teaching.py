from pathlib import Path
import ast,shutil,re
from datetime import datetime
p=Path(__file__).with_name('main.py');old=p.read_text();s=old
if 'from teaching import' not in s:s='from teaching import router as teaching_router, access as teaching_access, session_access\n'+s
if 'api.include_router(teaching_router)' not in s:s=s.replace('api.include_router(import_router)','api.include_router(import_router)\napi.include_router(teaching_router)',1)
if 'request.state.access' not in s:
    marker='        request.state.user_id = user_id'
    if marker not in s:raise SystemExit('Expected auth middleware not found; main.py not changed.')
    s=s.replace(marker,marker+"\n        request.state.access = await run_in_threadpool(teaching_access,user_id)\n        if request.state.access['role']=='teacher' and (request.state.access.get('disabled') or request.url.path!='/api/teaching/my-calendar' or request.method!='POST'):\n            return JSONResponse(status_code=403,content={'authenticated':True,'ok':False,'message':'მასწავლებელს მხოლოდ საკუთარი კალენდრის ნახვა შეუძლია.'})",1)
s=s.replace("('/api/program-import/','/api/days-off/')", "('/api/program-import/','/api/days-off/','/api/teaching/')")
s=s.replace('    _, result = validate_session(request, activity=False)\n    return result','    uid, result = validate_session(request, activity=False)\n    return session_access(uid,result)',1)
if 'დაკავშირებული ჩანაწერი' not in s:
    marker='    logging.error("Database failure: %s", type(exc).__name__)'
    s=s.replace(marker,"    if isinstance(exc,pymysql.err.IntegrityError):\n        return JSONResponse(status_code=409,content={'authenticated':True,'ok':False,'message':'დაკავშირებული ჩანაწერი ჯერ გამოიყენება ან მონაცემი მეორდება. ჯერ შეამოწმეთ ჯგუფის, მოდულისა და გაკვეთილის კავშირები.'})\n"+marker,1)
def methods(match):
    values=ast.literal_eval(match.group(1))
    for method in ('GET','POST','PUT','DELETE','OPTIONS'):
        if method not in values:values.append(method)
    return 'allow_methods='+repr(values)
s,count=re.subn(r'allow_methods\s*=\s*(\[[^\]]*\])',methods,s)
if not count or 'api.include_router(teaching_router)' not in s or 'return session_access(uid,result)' not in s:raise SystemExit('Expected main.py layout not found; file was not changed.')
ast.parse(s)
if s!=old:
    shutil.copy2(p,p.with_name('main.py.before-teaching-'+datetime.now().strftime('%Y%m%d%H%M%S%f')))
    p.write_text(s)
print('Teaching router and server-side teacher access guard configured.')
