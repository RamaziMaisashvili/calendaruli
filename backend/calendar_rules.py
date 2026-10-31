"""Pure date rules. No built-in claims about official/state holiday dates."""
from datetime import date, timedelta

DAY=timedelta(days=1)

def dates_between(start,end):
    for i in range((end-start).days+1):yield start+timedelta(days=i)

def as_date(value):
    return date.fromisoformat(value) if isinstance(value,str) else value

def normalize(entries):
    return [{**e,'start_date':as_date(e['start_date']),'end_date':as_date(e['end_date'])} for e in entries]

def matches(entry,day,program_type):
    if entry['scope'] not in ('all',program_type):return False
    if entry.get('annual'):
        return (entry['start_date'].month,entry['start_date'].day)<=(day.month,day.day)<=(entry['end_date'].month,entry['end_date'].day)
    return entry['start_date']<=day<=entry['end_date']

def day_status(entries,day,program_type):
    hits=[e for e in entries if matches(e,day,program_type)]
    # Vacation wins: a public holiday inside a vacation is never compensated.
    vacation=next((e for e in hits if e['kind']=='vacation'),None)
    if vacation:return 'vacation',[e['title'] for e in hits]
    if hits:return 'holiday',[e['title'] for e in hits]
    return ('weekend' if day.weekday()>4 else 'study'),[]

def build_calendar(start,end,program_type,mode,entries,occupied_saturdays=()):
    entries=normalize(entries)
    occupied=set(map(as_date,occupied_saturdays));reserved=set(occupied)
    first_monday=start-timedelta(days=start.weekday())
    weeks=[];days=[];number=0;missed=[];week_by_monday={}
    for offset in range(0,(end-first_monday).days+1,7):
        monday=first_monday+timedelta(days=offset)
        weekdays=[d for d in dates_between(monday,monday+timedelta(days=4)) if start<=d<=end]
        statuses=[(d,*day_status(entries,d,program_type)) for d in weekdays]
        has_study=any(status=='study' for d,status,titles in statuses)
        if has_study:number+=1
        week_number=number if has_study else None
        week_by_monday[monday]=week_number
        weeks.append({'monday':monday,'sunday':monday+timedelta(days=6),'number':week_number,'study_days':sum(s=='study' for _,s,_ in statuses)})
        for d,status,titles in statuses:
            days.append({'date':d,'kind':status,'titles':titles,'week':week_number})
            if status=='holiday':missed.append((d,week_number))
    makeups=[]
    if mode=='saturday':
        for source,source_week in missed:
            target=source+timedelta(days=5-source.weekday())
            # Finite search fails explicitly instead of silently dropping a lesson.
            for attempt in range(520):
                status,_=day_status(entries,target,program_type)
                if target not in reserved and status=='weekend':break
                target+=timedelta(days=7)
            else:raise ValueError('ანაზღაურებისთვის თავისუფალი შაბათი ვერ მოიძებნა.')
            reserved.add(target)
            makeups.append({'source_date':source,'date':target,'source_week':source_week})
    return {'weeks':weeks,'days':days,'makeups':makeups,'study_week_count':number,
            'missed_day_count':len(missed),'vacation_day_count':sum(d['kind']=='vacation' for d in days),
            'available_teaching_dates':[d['date'] for d in days if d['kind']=='study'],
            'mode':mode,'start_date':start,'end_date':end,
            'warning':'მოდულების დასრულების თარიღები გამოითვლება დღიური გაკვეთილების განრიგის შედგენისას. აქ ნაჩვენებია სასწავლო დღეები და უქმე დღის გადატანის თარიღები.'}
