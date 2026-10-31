"""Run once next to main.py. Adds the router without replacing DB/auth settings."""
from pathlib import Path
import ast
import shutil
from datetime import datetime
p=Path(__file__).with_name('main.py')
text=p.read_text(encoding='utf-8')
if 'from days_off import router as days_off_router' not in text:
    text='from days_off import router as days_off_router\n'+text
if 'api.include_router(days_off_router)' not in text:
    marker='api.include_router(import_router)'
    if marker not in text:raise SystemExit('main.py: expected router marker not found; file not changed.')
    text=text.replace(marker,marker+'\napi.include_router(days_off_router)',1)
text=text.replace("request.url.path.startswith('/api/program-import/')", "request.url.path.startswith(('/api/program-import/','/api/days-off/'))")
# Keep the established allowed origins/headers, adding only the required methods.
import re
def methods(match):
    values=ast.literal_eval(match.group(1))
    for method in ('GET','POST','PUT','DELETE','OPTIONS'):
        if method not in values:values.append(method)
    return 'allow_methods='+repr(values)
text,count=re.subn(r'allow_methods\s*=\s*(\[[^\]]*\])',methods,text)
if not count:raise SystemExit('main.py: allow_methods not found; file not changed.')
ast.parse(text)
if text!=p.read_text(encoding='utf-8'):
    backup=p.with_name('main.py.before-days-off-'+datetime.now().strftime('%Y%m%d%H%M%S%f'))
    shutil.copy2(p,backup)
    p.write_text(text,encoding='utf-8')
    print('main.py updated; backup: '+backup.name)
else:print('main.py already configured.')
