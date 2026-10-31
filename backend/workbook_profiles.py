import re,math
from openpyxl.utils import get_column_letter
from excel_parser import _number,_cell_text

def text(v):return re.sub(r'\s+','',str(v or '')).lower()

def detect(ws):
    header=None;cols={}
    for r in range(1,min(ws.max_row,12)+1):
        found={}
        for c in range(1,min(ws.max_column,25)+1):
            t=text(ws.cell(r,c).value)
            if t in ('სულ','სრული'):found['total']=c
            elif t.startswith('დამო'):found['independent']=c
            elif t.startswith('საკო'):found['contact']=c
            elif t.startswith('შეფა'):found['assessment']=c
            elif t in ('მოდული','მოდულები','პროფესიულიმოდულები'):found['name']=c
        if {'name','total','contact','independent'}<=found.keys():header=r;cols=found;break
    if not header:return None
    best=[];number_row=None
    for r in range(1,min(ws.max_row,12)+1):
        for c in range(1,min(ws.max_column,300)+1):
            if ws.cell(r,c).value!=1:continue
            run=[]
            for offset in range(200):
                if c+offset>ws.max_column or ws.cell(r,c+offset).value!=offset+1:break
                run.append(c+offset)
            if len(run)>len(best):best=run;number_row=r
    if len(best)<2:return None
    date_row=number_row+1 if any(ws.cell(number_row+1,c).value is not None for c in best) else None
    # Category headings and module names distinguish a date header from a data row.
    if date_row and any(_number(ws.cell(date_row,cols[k]).value) is not None for k in ('total','contact')):date_row=None
    return {'header':header,'cols':cols,'week_columns':best,'number_row':number_row,'date_row':date_row}

def extract(workbook,sheet):
    ws=workbook[sheet];p=detect(ws)
    if not p:raise ValueError('ფურცლის განლაგება ავტომატურად ვერ ამოიცნო. გამოიყენეთ ხელით მითითებული ფორმატი.')
    cols=p['cols'];weeks=p['week_columns'];modules=[];warnings=[];category='professional';consumed=set()
    for r in range(p['header']+1,min(ws.max_row,10000)+1):
        if r in consumed:continue
        name=ws.cell(r,cols['name']).value
        if modules and ('კვირეულიჯამ' in text(name) or text(name).startswith('სულ:')):break
        rowlabels=[text(ws.cell(r,c).value) for c in range(1,min(weeks[0],12))]
        label=' '.join(rowlabels)
        if 'ინტეგრირებული' in label and 'მოდულ' in label:category='integrated_general'
        elif 'ზოგადიმოდულ' in label:category='general'
        elif 'პროფესიულიმოდულ' in label:category='professional'
        if not isinstance(name,str) or not name.strip() or _number(ws.cell(r,cols['total']).value) is None:continue
        total=_number(ws.cell(r,cols['total']).value);contact=_number(ws.cell(r,cols['contact']).value) or 0
        independent=_number(ws.cell(r,cols['independent']).value)
        assessment=(_number(ws.cell(r,cols['assessment']).value) or 0) if 'assessment' in cols else 0
        contact_row=r;independent_row=None;total_row=None
        next_name=ws.cell(r+1,cols['name']).value if r<ws.max_row else None
        next2_name=ws.cell(r+2,cols['name']).value if r+2<=ws.max_row else None
        def rowlabel(row):return ' '.join(text(ws.cell(row,c).value) for c in range(1,weeks[0]))
        if next_name is None and 'დამოუკიდებელი' in rowlabel(r+2) and next2_name is None:
            total_row=r;contact_row=r+1;independent_row=r+2;consumed.update((r+1,r+2))
        elif next_name is None and category!='integrated_general':
            # Two-row layouts can have no row labels at all.
            if any(ws.cell(r+1,c).value is not None for c in weeks) or _number(ws.cell(r+1,cols['independent']).value) is not None:
                independent_row=r+1;consumed.add(r+1)
                second_independent=_number(ws.cell(r+1,cols['independent']).value)
                if independent is None and second_independent is not None:independent=second_independent
                second_total=_number(ws.cell(r+1,cols['total']).value)
                if second_total is not None:total+=second_total
        if independent is None:independent=0
        if category=='integrated_general' and independent>0:category='general'
        weekly=[]
        for c in weeks:
            def number(row):
                if row is None:return None
                raw=ws.cell(row,c).value;n=_number(raw)
                if n is None and raw is not None and str(raw).strip():raise ValueError(f'{get_column_letter(c)}{row}: კვირის საათები რიცხვი არ არის.')
                if n is not None and (not math.isfinite(n) or n<0):raise ValueError(f'{get_column_letter(c)}{row}: საათები არასწორია.')
                return n or 0
            h=number(contact_row);i=number(independent_row) if independent_row else (0 if independent==0 else None)
            t=number(total_row) if total_row else (h+i if i is not None else None)
            weekly.append({'week':_cell_text(ws.cell(p['number_row'],c).value),'date':_cell_text(ws.cell(p['date_row'],c).value) if p['date_row'] else None,'hours':h,'independent':i,'total':t})
        raw_name=re.sub(r'\s+',' ',name).strip();code=''
        match=re.search(r'(?<!\d)(\d{2}(?:\.\d{1,2}){2,})(?!\d)',raw_name)
        if match:code=match.group(1);raw_name=(raw_name[:match.start()]+' '+raw_name[match.end():]).strip(' -()')
        m={'source_row':r,'order':len(modules)+1,'name':raw_name,'code':code,'module_type':category,'total':total,'contact':contact,'independent':independent,'assessment':assessment,'weekly':weekly}
        modules.append(m)
        expected=contact+assessment
        if abs(total-expected-independent)>.011:warnings.append(f'სტრიქონი {r}: ფაილის ჯამური საათები ერთმანეთს არ ემთხვევა. გადამოწმება საჭიროა.')
        if abs(sum(w['hours'] for w in weekly)-expected)>.011:warnings.append(f'სტრიქონი {r}: ფაილის კვირეული საკონტაქტოს ჯამი {sum(w["hours"] for w in weekly):g}, ჯამურ სვეტში {expected:g}.')
        if independent_row is None and independent>0:warnings.append(f'სტრიქონი {r}: დამოუკიდებელი საათების კვირეული განაწილება ამ ფურცელზე არ არის; ცარიელი მნიშვნელობები შენარჩუნებულია.')
    if not modules:raise ValueError('ფურცელში მოდულები ვერ მოიძებნა.')
    settings={'sheet_name':sheet,'plan_format':'auto','week_count':len(weeks),'first_week_column':get_column_letter(weeks[0]),'week_number_row':p['number_row'],'week_dates_row':p['date_row'],'auto_profile':True}
    return modules,settings,warnings
