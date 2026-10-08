"""Import a reviewed HTML snapshot of the city council's timetable.
Usage: python scripts/import-izmail-city-schedule.py path/to/snapshot.html
Repeated printed columns are independent lists of departure times per stop.
"""
import collections
import datetime as dt
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = 'https://izmail-mr.od.gov.ua/rozklad-ruhu-miskyh-avtobusnyh-marshrutiv/'


def plain(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', ' ', value))).strip()


def extract(document):
    result = collections.defaultdict(list)
    previous = 0
    tables = list(re.finditer(r'<table\b[^>]*>(.*?)</table>', document, re.S))
    for index, match in enumerate(tables):
        context = plain(document[previous:match.start()])
        previous = match.end()
        ids = re.findall(r'маршрут[иів]*\s*№\s*([\d, АAаa-]+)', context, re.I)
        if not ids:
            continue
        route_ids = re.findall(r'\d+[АAаa]?', ids[-1])
        route_ids = ['10-А' if r.upper() in ('10А','10A') else r for r in route_ids]
        benefit = 'ЗВИЧАЙНОМУ РЕЖИМІ' in context
        day_match = re.findall(r'\(([^()]*)\)', context)
        day = day_match[-1] if day_match else 'Дни уточняются'
        day = 'Льготные рейсы' if benefit else day.strip()
        for uk, ru in [('Робочі дні','Рабочие дни'),('крім понеділка','кроме понедельника'),('Вихідні та святкові дні','Выходные и праздники'),('Вихідні та святкові','Выходные и праздники'),('вихідні та святкові','выходные и праздники'),('Щоденно','Ежедневно'),('Понеділок','Понедельник'),('Вівторок','Вторник'),('Середа','Среда'),('Четвер','Четверг'),('П’ятниця','Пятница'),('Неділя','Воскресенье'),('Неділю','Воскресенье'),('вівторок','вторник'),('середа','среда'),('четвер','четверг'),('п’ятниця','пятница'),('неділя','воскресенье'),('понеділок','понедельник'),('святкові дні','праздники')]:
            day = day.replace(uk,ru)
        day = day.replace('Субота','Суббота').replace('субота','суббота').replace(' та ',' и ').replace('праздники дні','праздники')
        rows = [[plain(cell) for cell in re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>', row, re.S)] for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>', match[1], re.S)]
        while rows and (not any(rows[0]) or 'ВІДПРАВЛЕННЯ З:' in ' '.join(rows[0])):
            rows.pop(0)
        if not rows:
            continue
        columns = collections.OrderedDict()
        for col, name in enumerate(rows[0]):
            arrival_departure = 'прибуття' in name.lower() and 'відправлення' in name.lower()
            if arrival_departure:
                name = re.sub(r'прибуття\s*-\s*відправлення', '· отправление',name,flags=re.I)
            columns.setdefault(name,set())
            for row in rows[1:]:
                if col<len(row):
                    # Preserve the footnote star; never infer a time from narrative text.
                    if re.match(r'^\d{1,2}:\d{2}',row[col]):
                        value = row[col]
                        if arrival_departure:
                            value = re.findall(r'\d{1,2}:\d{2}', value)[-1]
                        columns[name].add(re.sub(r'^(\d):',r'0\1:',value))
        columns = {name:sorted(times) for name,times in columns.items() if times}
        if not columns:
            continue
        packed = [list(columns)] + [[times[i] if i<len(times) else '—' for times in columns.values()] for i in range(max(map(len,columns.values()))) ]
        next_start = tables[index+1].start() if index+1<len(tables) else match.end()+1500
        after = plain(document[match.end():next_start])
        note = ''
        if any('*' in t for times in columns.values() for t in times):
            note = '* Льготный рейс.' if 'Пільгові рейси' in after else '* Ежедневно, кроме субботы и воскресенья.' if 'крім суботи' in after else '* Условия отмеченного рейса уточните в расписании горсовета.'
        for route_id in route_ids:
            result[route_id].append({'label':day,'rows':packed,'note':note,'independentStops':True})
    return result


def main():
    document = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
    schedules = extract(document)
    if len(schedules) != 16:
        raise ValueError('Unexpected route count; review the source before importing')
    target = ROOT / 'transport/bus-schedule/schedule-data.json'
    routes = json.loads(target.read_text(encoding='utf-8'))
    source_date = re.search(r'<time class="updated" datetime="(\d{4}-\d{2}-\d{2})',document)
    if not source_date:
        raise ValueError('Missing council update date')
    for route in routes:
        if route['id'] not in schedules:
            raise ValueError('Missing route '+route['id'])
        route['schedules'] = schedules[route['id']]
        route['source'] = {'url':SOURCE,'updated':source_date[1],'checkedAt':dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')}
    target.write_text(json.dumps(routes,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print('Imported',len(schedules),'routes and',sum(map(len,schedules.values())),'day/benefit schedules')


if __name__ == '__main__':
    main()
