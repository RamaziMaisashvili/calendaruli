from pathlib import Path
import ast,shutil
from datetime import datetime
p=Path(__file__).with_name('main.py')
s=p.read_text(encoding='utf-8')
new=s
if 'from plan_breaks import router as plan_breaks_router' not in new:new='from plan_breaks import router as plan_breaks_router\n'+new
if 'api.include_router(plan_breaks_router)' not in new:
    marker='api.include_router(days_off_router)'
    if marker not in new:raise SystemExit('Install the previous days-off update first. main.py was not changed.')
    new=new.replace(marker,marker+'\napi.include_router(plan_breaks_router)',1)
ast.parse(new)
if new!=s:
    shutil.copy2(p,p.with_name('main.py.before-plan-breaks-'+datetime.now().strftime('%Y%m%d%H%M%S%f')))
    p.write_text(new,encoding='utf-8')
print('Plan breaks router configured.')
