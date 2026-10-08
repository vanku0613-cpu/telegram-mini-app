"""Collect dated, public BusTrip records; never infer a daily timetable from a trip.

Standard library only. Run manually before build-regional-routes.mjs.
The output preserves failed sources and original service dates for honest ageing.
"""
import concurrent.futures
import datetime as dt
import html
import json
import pathlib
import re
import urllib.request
from urllib.parse import urljoin, urlparse, parse_qs

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'transport' / 'schedule-sources.json'
SEEDS = [
    'odesa/kyiv', 'izmail/odesa', 'kyiv/izmail', 'bolhrad/kyiv',
    'reni/izmail', 'kiliya/odesa', 'vilkove/odesa', 'artsyz/odesa',
    'tatarbunary/odesa', 'bilhorod-dnistrovskyy/odesa',
]
ORIGINS = {s.split('/')[0] for s in SEEDS}
BUS_POINTS = {
    'Одесса':'UA5110100000','Измаил':'UA5110600000','Килия':'UA5122310100',
    'Вилково':'UA5122310300','Рени':'UA5124110100','Болград':'UA5121410100',
    'Арциз':'UA5120410100','Татарбунары':'UA5125010100','Белгород-Днестровский':'UA5110300000',
    'Киев':'UA8000000000','Сарата':'UA5124555100','Херсон':'UA6510100000','Кишинёв':'MD0101000000',
}


def parse_bus(document, url):
    query = parse_qs(urlparse(url).query)
    names = {v:k for k,v in BUS_POINTS.items()}
    origin, destination = names.get(query.get('point_from',[''])[0]), names.get(query.get('point_to',[''])[0])
    if not origin or not destination:
        return []
    trips = []
    for row in re.findall(r'<tr\b[^>]*class="trip"[^>]*>(.*?)</tr>', document, re.S):
        cells = re.findall(r'<td\b([^>]*)>(.*?)</td>', row, re.S)
        if len(cells) < 8:
            continue
        date = re.search(r'class="date_dep">(\d{2}\.\d{2}\.\d{2})</span>', row)
        time = re.search(r'<b>(\d{2}:\d{2})</b>', cells[2][1])
        start = re.findall(r'<small\b[^>]*>(.*?)</small>', cells[2][1], re.S)
        end = re.findall(r'<small\b[^>]*>(.*?)</small>', cells[3][1], re.S)
        service = re.findall(r'<small\b[^>]*>(.*?)</small>', cells[7][1], re.S)
        if not date or not time or not start:
            continue
        day = dt.datetime.strptime(date[1], '%d.%m.%y').date().isoformat()
        title = re.search(r'title="([^"]*)"', cells[2][0])
        address = html.unescape(title[1]) if title else plain(start[1]) if len(start)>1 else ''
        address = re.sub(r'\{[^}]*\}', '', address).split('; Телефон:')[0].strip()
        trips.append({'departure':day+'T'+time[1]+':00', 'arrival':'',
                      'from':origin,'to':destination,'fromStop':plain(start[0]),'fromAddress':address,
                      'toStop':plain(end[0]) if end else '', 'toAddress':'',
                      'country':query['point_to'][0][:2], 'carrier':plain(service[1]) if len(service)>1 else '',
                      'service':plain(service[0]) if service else '', 'transfer':'пересад' in plain(row).lower()})
    return trips


def bus_urls():
    pairs = set()
    directory = ROOT / 'transport/city-schedule/data'
    for file in directory.glob('*.json'):
        if file.stem in ('kyiv','regional-routes','regional-direction-overrides'):
            continue
        for group in json.loads(file.read_text(encoding='utf-8')).get('groups',[]):
            for route in group.get('routes',[]):
                for direction in route.get('directions',[]):
                    stops = direction.get('stops',[])
                    if len(stops)>=2:
                        pairs.add((stops[0]['name'],stops[-1]['name']))
    # Verify both travel directions independently; no reverse timetable is inferred.
    pairs |= {(b,a) for a,b in list(pairs)}
    pairs |= {('Одесса',name) for name in BUS_POINTS if name!='Одесса'}
    return {f'https://ticket.bus.com.ua/order/forming_bn?point_from={BUS_POINTS[a]}&point_to={BUS_POINTS[b]}&date_add=1&fn=round_search&lang=ua'
            for a,b in pairs if a in BUS_POINTS and b in BUS_POINTS}


def plain(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', value))).strip()


def parse_station(document):
    """Station homepage includes through services. The query origin is authoritative."""
    trips = []
    for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>', document, re.S | re.I):
        match = re.search(r'<a\b[^>]*href="([^"]*for_city=[^"]*)"[^>]*>(.*?)</a>', row, re.S)
        if not match:
            continue
        query = parse_qs(urlparse(html.unescape(match[1])).query)
        if query.get('from') != ['Одеса'] or not query.get('to'):
            continue
        digits = re.findall(r'class="numb oswald">\s*(\d)\s*</div>', row)
        if len(digits) != 4:
            continue
        try:
            day = dt.datetime.strptime(query['date'][0], '%d.%m.%Y').date().isoformat()
            time = ''.join(digits[:2]) + ':' + ''.join(digits[2:])
            dt.time.fromisoformat(time)
        except (KeyError, ValueError):
            continue
        trips.append({'departure': day + 'T' + time + ':00', 'arrival': '',
                      'from': 'Одеса', 'to': query['to'][0], 'fromStop': 'АС «Привокзальная»',
                      'fromAddress': 'Старосенная площадь, 1Б', 'toStop': '', 'toAddress': '',
                      'country': '', 'carrier': 'АС «Привокзальная»', 'service': plain(match[2]),
                      'transfer': 'пересад' in plain(row).lower()})
    return trips


def parse_trips(document):
    trips = []
    for raw in re.findall(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', document, re.S | re.I):
        try:
            data = json.loads(raw)
        except (ValueError, TypeError):
            continue
        stack = data if isinstance(data, list) else [data]
        while stack:
            item = stack.pop()
            if not isinstance(item, dict):
                continue
            stack.extend(item.get('@graph', []))
            if item.get('@type') != 'BusTrip':
                continue
            start, end = item.get('departureBusStop', {}), item.get('arrivalBusStop', {})
            timestamp = item.get('departureTime', '')
            if not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}', timestamp):
                continue
            try:
                dt.datetime.fromisoformat(timestamp)
            except ValueError:
                continue
            if not start.get('address', {}).get('addressLocality') or not end.get('address', {}).get('addressLocality'):
                continue
            trips.append({
                'departure': timestamp, 'arrival': item.get('arrivalTime', ''),
                'from': start['address']['addressLocality'], 'to': end['address']['addressLocality'],
                'fromStop': start.get('name', ''), 'fromAddress': start['address'].get('streetAddress', ''),
                'toStop': end.get('name', ''), 'toAddress': end['address'].get('streetAddress', ''),
                'country': end['address'].get('addressCountry', ''),
                'carrier': item.get('provider', {}).get('name', ''),
                'service': item.get('busName', ''),
            })
    return list({json.dumps(t, sort_keys=True): t for t in trips}.values())


def fetch(url):
    now = dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (schedule reference audit)'})
        with urllib.request.urlopen(req, timeout=35) as response:
            document = response.read(10_000_000).decode('utf-8')
        links = set()
        for origin, dest in re.findall(r'href=["\'](?:https://likebus.ua)?/route/([a-z-]+)/([a-z-]+)/', document):
            if origin in ORIGINS:
                links.add(f'https://likebus.ua/route/{origin}/{dest}/')
        trips = parse_bus(document,url) if url.startswith('https://ticket.bus.com.ua/') else parse_station(document) if url == 'https://odessa-bus.com.ua/' else parse_trips(document)
        return {'url': url, 'checkedAt': now, 'trips': trips}, links
    except Exception as exc:
        return {'url': url, 'attemptedAt': now, 'error': type(exc).__name__, 'trips': []}, set()


def main():
    previous = {}
    if OUT.exists():
        previous = {s['url']: s for s in json.loads(OUT.read_text(encoding='utf-8'))['sources']}
    results, discovered = {}, set()
    def batch(urls):
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
            for record, links in pool.map(fetch, sorted(urls)):
                if record.get('error') and record['url'] in previous:
                    record = {**previous[record['url']], 'lastError': record['error'], 'attemptedAt': record['attemptedAt']}
                results[record['url']] = record
                discovered.update(links)
                print(record['url'], len(record['trips']), record.get('error', ''), flush=True)
    import sys
    if '--bus-only' in sys.argv:
        results.update(previous)
    else:
        batch({f'https://likebus.ua/route/{s}/' for s in SEEDS} | {'https://odessa-bus.com.ua/'})
        batch(sorted(discovered - results.keys())[:100])
    batch(bus_urls())
    OUT.write_text(json.dumps({'collectedAt': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'), 'sources': list(results.values())}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Saved', len(results), 'sources;', sum(len(s['trips']) for s in results.values()), 'dated trips')


if __name__ == '__main__':
    main()
