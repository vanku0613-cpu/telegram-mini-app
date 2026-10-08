"""Build dated Kyiv timetables from the official GTFS, including service calendars."""
import collections
import csv
import datetime as dt
import io
import json
import pathlib
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]


def active(service, date, exceptions):
    key = (service['service_id'], date.strftime('%Y%m%d'))
    if key in exceptions:
        return exceptions[key] == '1'
    day = date.strftime('%Y%m%d')
    return service['start_date'] <= day <= service['end_date'] and service[('monday','tuesday','wednesday','thursday','friday','saturday','sunday')[date.weekday()]] == '1'


def main():
    z = zipfile.ZipFile(sys.argv[1])
    def read(name):
        return list(csv.DictReader(io.TextIOWrapper(z.open(name+'.txt'),encoding='utf-8-sig')))
    feed = read('feed_info')[0]
    start = dt.datetime.strptime(feed['feed_start_date'],'%Y%m%d').date()
    end = dt.datetime.strptime(feed['feed_end_date'],'%Y%m%d').date()
    days = [start+dt.timedelta(days=i) for i in range(min((end-start).days+1,7))]
    services = {r['service_id']:r for r in read('calendar')}
    exceptions = {(r['service_id'],r['date']):r['exception_type'] for r in read('calendar_dates')}
    service_dates = {key:[d.isoformat() for d in days if active(service,d,exceptions)] for key,service in services.items()}
    stops = {s['stop_id']:{'name':s['stop_name'],'lat':float(s['stop_lat']),'lng':float(s['stop_lon'])} for s in read('stops')}
    times = collections.defaultdict(list)
    for row in read('stop_times'):
        times[row['trip_id']].append(row)
    for values in times.values():
        values.sort(key=lambda x:int(x['stop_sequence']))
    shapes = collections.defaultdict(list)
    for row in read('shapes'):
        shapes[row['shape_id']].append(row)
    shapes = {key:[[float(r['shape_pt_lat']),float(r['shape_pt_lon'])] for r in sorted(rows,key=lambda r:int(r['shape_pt_sequence']))] for key,rows in shapes.items()}
    trip_groups = collections.defaultdict(dict)
    for trip in read('trips'):
        dates = service_dates.get(trip['service_id'],[])
        points = times.get(trip['trip_id'],[])
        if not dates or len(points)<2:
            continue
        key = (trip['direction_id'],points[0]['stop_id'],points[-1]['stop_id'],trip['shape_id'])
        if key not in trip_groups[trip['route_id']]:
            start_stop,end_stop = stops[points[0]['stop_id']],stops[points[-1]['stop_id']]
            trip_groups[trip['route_id']][key] = {'label':start_stop['name']+' → '+end_stop['name'], 'name':start_stop['name']+' → '+end_stop['name'], 'hours':'','interval':'','departures':[], 'extra':'', 'stops':[stops[p['stop_id']] for p in points], 'shape':shapes.get(trip['shape_id'],[]), 'serviceDates':{}}
        direction = trip_groups[trip['route_id']][key]
        for date in dates:
            direction['serviceDates'].setdefault(date,set()).add(points[0]['departure_time'][:5])
    groups = {'3':{'id':'bus','title':'Автобусы','icon':'🚌','fare':'','routes':[]},'11':{'id':'trolleybus','title':'Троллейбусы','icon':'🚎','fare':'','routes':[]},'0':{'id':'tram','title':'Трамваи','icon':'🚋','fare':'','routes':[]}}
    for route in read('routes'):
        if route['route_type'] not in groups:
            continue
        directions = list(trip_groups[route['route_id']].values())
        if not directions:
            # An inactive route is not offered as a working daily service.
            continue
        for direction in directions:
            direction['serviceDates'] = {day:sorted(values) for day,values in direction['serviceDates'].items()}
        groups[route['route_type']]['routes'].append({'id':route['route_short_name'],'name':route['route_long_name'] or 'Маршрут '+route['route_short_name'],'days':'На указанные даты','directions':directions,'sourceUrl':route['route_url'] or 'https://kpt.kyiv.ua/schedule'})
    result = {'updated':start.strftime('%d.%m.%Y'),'title':'Расписание Киев','subtitle':'Городской транспорт · междугородние направления','source':{'url':'https://data.kyivcity.gov.ua/dataset/7b958c05-43ba-4ae5-b541-01904d658030/resource/58f0c3d0-9409-4de9-92c8-de4afa035efd','version':feed['feed_version'],'validFrom':start.isoformat(),'validTo':end.isoformat()},'groups':list(groups.values())}
    if sum(len(g['routes']) for g in result['groups'])<120:
        raise ValueError('Too few active routes; inspect the feed')
    (ROOT/'transport/city-schedule/data/kyiv.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print('Kyiv:',[(g['id'],len(g['routes'])) for g in result['groups']], 'valid',start,end)


if __name__=='__main__':
    main()
