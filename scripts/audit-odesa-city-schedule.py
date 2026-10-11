"""Read the operator's published baseline timetable, without inventing intervals."""
import concurrent.futures
import datetime as dt
import html
import json
import pathlib
import re
import shutil
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
INDEX = 'https://oget.od.ua/rozklad-ruhu-all/'


def get(url):
    result = subprocess.run([shutil.which('curl.exe') or 'curl','--fail','--silent','--show-error','--location','--user-agent','Mozilla/5.0 (compatible; ScheduleReference/1.0)','--max-time','30',url],capture_output=True,check=True)
    return result.stdout.decode('utf-8')


def plain(value):
    value=re.sub(r'</?(?:strong|b|em|span|i)\b[^>]*>','',value)
    return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',value))).strip()


def extract(document):
    tables = re.findall(r'<table\b[^>]*>(.*?)</table>',document,re.S)
    for table in tables:
        rows = re.findall(r'<tr\b[^>]*>(.*?)</tr>',table,re.S)
        for row in rows:
            cells = re.findall(r'<td\b[^>]*>(.*?)</td>',row,re.S)
            if len(cells)<5:
                continue
            # Last three cells: first departure by terminus, last departure, interval.
            first = [plain(p) for p in re.findall(r'<p\b[^>]*>(.*?)</p>',cells[-3],re.S)]
            last = [plain(p) for p in re.findall(r'<p\b[^>]*>(.*?)</p>',cells[-2],re.S)]
            # Terminal labels can include a destination or a depot. Do not pair
            # those with an unrelated first departure by their row position.
            def departures(lines):
                entries = []
                pending = ''
                for line in lines:
                    times = re.findall(r'\d{1,2}[.:]\d{2}',line)
                    if not times:
                        pending = (pending+' '+line).strip()
                        continue
                    if len(times) != 1:
                        continue
                    label = re.sub(r'\s*[–—-]?\s*\d{1,2}[.:]\d{2}.*$','',line).strip()
                    label = (pending+' '+label).strip()
                    pending = ''
                    time = times[0].replace('.',':').zfill(5)
                    if label and re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d',time):
                        entries.append({'label':label,'time':time})
                return entries
            starts, ends = departures(first), departures(last)
            if len(starts)>=2 and len(ends)>=2:
                terminals = [{'terminal':a['label'],'first':a['time'],'last':b['time']}
                             for a in starts for b in ends if a['label']==b['label']]
                return {'terminals':terminals,'firstDepartures':starts,'lastDepartures':ends,
                        'interval':plain(cells[-1])}
    return None


def main():
    document = get(INDEX)
    links={}
    for url,label in re.findall(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',document,re.S):
        label=plain(label);m=re.fullmatch(r'(Трамвай|Тролейбус) №(\d+)',label)
        if m:links[('tram' if m[1]=='Трамвай' else 'trolleybus',m[2])]=url
    if len(links)<14:
        raise ValueError('Official schedule index changed')
    def collect(pair):
        key,url=pair
        try:
            timetable=extract(get(url))
            print(key, 'parsed' if timetable else 'unrecognized table', flush=True)
            return key,{'url':url,'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'),'timetable':timetable}
        except Exception as exc:
            print(key, type(exc).__name__, flush=True)
            return key,None
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        checked=dict(pool.map(collect,links.items()))
    if sum(bool(s and s['timetable']) for s in checked.values())<10:
        raise ValueError('Too few parsed timetables; review before replacing')
    file=ROOT/'transport/odessa-schedule/schedule-data.json'
    data=json.loads(file.read_text(encoding='utf-8'))
    social = json.loads((ROOT/'transport/odessa-schedule/social-timetable.json').read_text(encoding='utf-8'))['routes']
    for group in data['groups']:
        for route in group['routes']:
            record = social.get(route['id']) if group['id']=='bus' else checked.get((group['id'],route['id']))
            route['sourceReview']=record or {'url':INDEX,'status':'unconfirmed'}
    data['auditDate']=dt.date.today().isoformat()
    file.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print('Operator pages checked:',len(checked),'parsed:',sum(bool(s and s['timetable']) for s in checked.values()))


if __name__=='__main__':main()
