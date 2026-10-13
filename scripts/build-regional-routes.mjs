import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import model from '../transport/city-schedule/schedule-model.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'transport', 'city-schedule', 'data');
const sourceFiles = fs.readdirSync(dataDir)
  .filter(name => name.endsWith('.json') && !['kyiv.json', 'regional-routes.json', 'regional-direction-overrides.json'].includes(name))
  .sort();

const aliases = new Map([
  ['одеса', 'Одесса'],
  ['одесса', 'Одесса'],
  ['ізмаїл', 'Измаил'],
  ['измаил', 'Измаил'],
  ['рені', 'Рени'],
  ['рени', 'Рени'],
  ['білгород-дністровський', 'Белгород-Днестровский'],
  ['белгород-днестровский', 'Белгород-Днестровский'],
  ['київ', 'Киев'],
  ['киев', 'Киев']
]);

const norm = value => String(value || '')
  .toLocaleLowerCase('ru')
  .replace(/ё/g, 'е')
  .replace(/[ії]/g, 'и')
  .replace(/є/g, 'е')
  .replace(/[^a-zа-я0-9]+/gi, ' ')
  .trim();

const cleanPlace = value => {
  const trimmed = String(value || '').trim();
  return model.canonical(aliases.get(norm(trimmed)) || trimmed);
};

const stationReferencePages = new Map([
  ['измаил', 'https://bus-info.in.ua/odeska-oblast/izmayil/'],
  ['арциз', 'https://bus-info.in.ua/odeska-oblast/artsiz/'],
  ['белгород днестровский', 'https://bus-info.in.ua/odeska-oblast/bilgorod-dnistrovskij/'],
  ['болград', 'https://bus-info.in.ua/odeska-oblast/bolgrad/'],
  ['килия', 'https://bus-info.in.ua/odeska-oblast/kiliya/'],
  ['рени', 'https://bus-info.in.ua/odeska-oblast/reni/'],
  ['татарбунары', 'https://bus-info.in.ua/odeska-oblast/tatarbunari/'],
  ['одесса', 'https://bus-info.in.ua/odeska-oblast/odesa/']
]);

function directoryReference(direction) {
  const stops = direction.stops || [];
  const origin = cleanPlace(stops[0]?.name);
  const page = stationReferencePages.get(norm(origin)) || 'https://bus-info.in.ua/odeska-oblast/';
  return page ? [{
    url: page,
    label: stationReferencePages.has(norm(origin))
      ? `Открытое расписание автостанции ${origin}`
      : 'Открытый справочник автобусных маршрутов Одесской области',
    checkedAt: '2026-10-13'
  }] : [];
}

function routePlaces(route) {
  const fromName = String(route.name || '').split(/\s+(?:—|↔|⇄)\s+/).map(cleanPlace).filter(Boolean);
  if (fromName.length >= 2) return [fromName[0], fromName.at(-1)];
  const stops = route.directions?.[0]?.stops || [];
  return [cleanPlace(stops[0]?.name), cleanPlace(stops.at(-1)?.name)].filter(Boolean);
}

function directionKey(direction) {
  const stops = direction.stops || [];
  const endpoints = [stops[0]?.name, stops.at(-1)?.name].map(cleanPlace).filter(Boolean);
  return endpoints.length === 2 ? endpoints.map(norm).join('>') : norm(direction.name);
}

function mergeDirections(target, incoming) {
  for (const direction of incoming || []) {
    const key = directionKey(direction);
    const existing = target.find(item => directionKey(item) === key);
    if (!existing) {
      target.push(direction);
      continue;
    }
    const departures = [...new Set([...(existing.departures || []), ...(direction.departures || [])])].sort();
    existing.departures = departures;
    if ((!existing.hours || existing.hours.length < (direction.hours || '').length) && direction.hours) existing.hours = direction.hours;
    if ((!existing.interval || existing.interval.length < (direction.interval || '').length) && direction.interval) existing.interval = direction.interval;
    if ((!existing.extra || existing.extra.length < (direction.extra || '').length) && direction.extra) existing.extra = direction.extra;
    if ((direction.stops || []).length > (existing.stops || []).length) existing.stops = direction.stops;
    if ((direction.shape || []).length > (existing.shape || []).length) existing.shape = direction.shape;
  }
}

const merged = new Map();
for (const file of sourceFiles) {
  const city = path.basename(file, '.json');
  const payload = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  for (const group of payload.groups || []) {
    for (const route of group.routes || []) {
      const places = routePlaces(route);
      if (places.length < 2) continue;
      const key = places.map(norm).sort().join('|');
      let item = merged.get(key);
      if (!item) {
        item = {
          id: places.slice().sort((a, b) => a.localeCompare(b, 'ru')).join(' ↔ '),
          name: places.join(' — '),
          places: [...new Set(places)],
          days: route.days || 'По расписанию',
          fare: group.fare || '',
          directions: [],
          sources: []
        };
        merged.set(key, item);
      }
      item.places = [...new Set([...item.places, ...places])];
      item.sources.push(`${city}:${group.id}:${route.id}`);
      if (!item.fare && group.fare) item.fare = group.fare;
      mergeDirections(item.directions, route.directions);
    }
  }
}

const overrideFile = path.join(dataDir, 'regional-direction-overrides.json');
if (fs.existsSync(overrideFile)) {
  const overrides = JSON.parse(fs.readFileSync(overrideFile, 'utf8'));
  for (const override of overrides.directions || []) {
    const places = [cleanPlace(override.from), cleanPlace(override.to)];
    const key = places.map(norm).sort().join('|');
    let item = merged.get(key);
    if (!item) {
      item = {
        id: places.slice().sort((a, b) => a.localeCompare(b, 'ru')).join(' ↔ '),
        name: places.join(' — '),
        places: [...places],
        days: override.days || 'По расписанию',
        fare: '',
        directions: [],
        sources: []
      };
      merged.set(key, item);
    }
    const coordinates = new Map();
    for (const direction of item.directions) {
      for (const stop of direction.stops || []) coordinates.set(norm(stop.name), { lat: stop.lat, lng: stop.lng });
    }
    const fromPoint = override.fromPoint || coordinates.get(norm(override.from));
    const toPoint = override.toPoint || coordinates.get(norm(override.to));
    const stops = [
      { name: places[0], ...(fromPoint || {}) },
      { name: places[1], ...(toPoint || {}) }
    ];
    const shape = fromPoint && toPoint ? [[fromPoint.lat, fromPoint.lng], [toPoint.lat, toPoint.lng]] : [];
    mergeDirections(item.directions, [{
      label: `Из ${places[0]}`,
      name: `${places[0]} → ${places[1]}`,
      hours: override.hours || '',
      interval: override.interval || '',
      departures: override.departures || [],
      extra: override.extra || '',
      stops,
      shape
    }]);
    item.places = [...new Set([...item.places, ...places])];
    item.sources.push(`legacy:${override.source || 'open-schedule'}`);
  }
}

// Keep discovered folders when a service is temporarily unavailable for sale.
// Only route identity is carried forward, never yesterday's departure times.
const previousFile = path.join(dataDir, 'regional-routes.json');
if (fs.existsSync(previousFile)) {
  for (const old of JSON.parse(fs.readFileSync(previousFile, 'utf8')).routes || []) {
    const places = old.places.map(cleanPlace);
    const key = places.map(norm).sort().join('|');
    if (!merged.has(key)) merged.set(key, {...old,places});
    else mergeDirections(merged.get(key).directions,old.directions);
  }
}

// Earlier snapshots mixed 2014/2019 publications with generated update dates.
// Keep the route catalogue, but never offer those times as a current timetable.
for (const item of merged.values()) {
  item.days = 'Даты и наличие рейсов уточняются';
  item.fare = '';
  item.directions = item.directions.map(d => {
    const hasReferenceTime = Boolean(d.hours || d.interval || (d.departures || []).length);
    const referenceSchedules = hasReferenceTime ? [{
      days: d.days || 'По опубликованному расписанию',
      mode: 'Автобус / маршрутное такси',
      hours: d.hours || '',
      interval: d.interval || '',
      departures: d.departures || []
    }] : [];
    return {
      ...d, hours: '', interval: '', departures: [], extra: '',
      status: hasReferenceTime ? 'reference' : 'unconfirmed', trips: [], references: [],
      referenceKind: hasReferenceTime ? 'directory' : '',
      referenceSchedules,
      referenceSources: hasReferenceTime ? directoryReference(d) : [],
      officialReferences: [],
    };
  });
}

// Official competition schedules are useful when a route is not currently
// offered by the ticket systems. Keep them in a separate reference layer: they
// must never be mistaken for a confirmed departure on a particular date.
const officialReferenceFile = path.join(root, 'transport', 'schedule-official-references.json');
const officialReferenceData = JSON.parse(fs.readFileSync(officialReferenceFile, 'utf8'));
const officialReferencePlaces = new Set();
for (const route of officialReferenceData.routes || []) {
  const places = [cleanPlace(route.from), cleanPlace(route.to)];
  places.forEach(place => officialReferencePlaces.add(place));
  const key = places.map(norm).sort().join('|');
  let item = merged.get(key);
  if (!item) {
    item = {
      id: places.slice().sort((a, b) => a.localeCompare(b, 'ru')).join(' ↔ '),
      name: places.join(' — '),
      places: [...places],
      days: 'Официальное базовое расписание',
      fare: '',
      directions: [],
      sources: []
    };
    merged.set(key, item);
  }
  const coordinates = new Map();
  for (const direction of item.directions) {
    for (const stop of direction.stops || []) {
      if (Number.isFinite(stop.lat) && Number.isFinite(stop.lng)) {
        coordinates.set(norm(stop.name), {lat: stop.lat, lng: stop.lng});
      }
    }
  }
  for (const referenceDirection of route.directions || []) {
    const from = cleanPlace(referenceDirection.from);
    const to = cleanPlace(referenceDirection.to);
    let direction = item.directions.find(candidate => {
      const stops = candidate.stops || [];
      return cleanPlace(stops[0]?.name) === from && cleanPlace(stops.at(-1)?.name) === to;
    });
    if (!direction) {
      const fromPoint = coordinates.get(norm(from));
      const toPoint = coordinates.get(norm(to));
      direction = {
        label: `Из ${from}`,
        name: `${from} → ${to}`,
        hours: '', interval: '', departures: [], extra: '',
        stops: [{name: from, ...(fromPoint || {})}, {name: to, ...(toPoint || {})}],
        shape: fromPoint && toPoint ? [[fromPoint.lat, fromPoint.lng], [toPoint.lat, toPoint.lng]] : [],
        status: 'reference', trips: [], references: []
      };
      item.directions.push(direction);
    }
    direction.referenceSchedules = referenceDirection.schedules || [];
    direction.officialReferences = [route.publication, route.award].filter(Boolean);
    direction.referenceSources = direction.officialReferences;
    direction.referenceKind = 'official';
    direction.referenceRouteCode = route.routeCode || '';
    direction.referenceCheckedAt = officialReferenceData.updated;
    direction.status = 'reference';
  }
  item.days = 'Официальное базовое расписание';
  item.sources.push(`official-reference:${route.routeCode || key}`);
}

// A few station-board departures do not exist in the legacy city files.
// Keep these source-backed additions explicit so they can be reviewed and
// updated without turning search snippets into generated data.
const openReferenceFile = path.join(root, 'transport', 'schedule-open-references.json');
const openReferenceData = JSON.parse(fs.readFileSync(openReferenceFile, 'utf8'));
for (const route of openReferenceData.routes || []) {
  const places = [cleanPlace(route.from), cleanPlace(route.to)];
  const key = places.map(norm).sort().join('|');
  let item = merged.get(key);
  if (!item) {
    item = {
      id: places.slice().sort((a, b) => a.localeCompare(b, 'ru')).join(' ↔ '),
      name: places.join(' — '), places, days: 'Справочное расписание', fare: '',
      directions: [], sources: []
    };
    merged.set(key, item);
  }
  for (const referenceDirection of route.directions || []) {
    const from = cleanPlace(referenceDirection.from);
    const to = cleanPlace(referenceDirection.to);
    let direction = item.directions.find(candidate => {
      const stops = candidate.stops || [];
      return cleanPlace(stops[0]?.name) === from && cleanPlace(stops.at(-1)?.name) === to;
    });
    if (!direction) {
      direction = {
        label: `Из ${from}`, name: `${from} → ${to}`,
        hours: '', interval: '', departures: [], extra: '',
        stops: [{name: from}, {name: to}], shape: [], trips: [], references: []
      };
      item.directions.push(direction);
    }
    direction.referenceSchedules = referenceDirection.schedules || [];
    direction.referenceSources = route.references || [];
    direction.referenceKind = 'directory';
    direction.referenceCheckedAt = openReferenceData.updated;
    direction.status = 'reference';
  }
  item.days = 'Справочное расписание';
  item.sources.push(`open-reference:${key}`);
}

const sourceFile = path.join(root, 'transport', 'schedule-sources.json');
const snapshot = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
for (const source of snapshot.sources) {
  for (const trip of source.trips || []) {
    const from = model.canonical(trip.from), to = model.canonical(trip.to);
    if (!from || !to || from === to || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trip.departure)) continue;
    const places = [from, to], key = places.map(norm).sort().join('|');
    let item = merged.get(key);
    if (!item) {
      item = {id: places.slice().sort((a,b) => a.localeCompare(b,'ru')).join(' ↔ '), name: places.join(' — '), places, days:'Рейсы на указанные даты', fare:'', directions:[], sources:[]};
      merged.set(key, item);
    }
    let direction = item.directions.find(d => model.canonical(d.stops?.[0]?.name) === from && model.canonical(d.stops?.at(-1)?.name) === to);
    if (!direction) {
      direction = {label:`Из ${from}`,name:`${from} → ${to}`,hours:'',interval:'',departures:[],extra:'',stops:[{name:from},{name:to}],shape:[],trips:[],references:[]};
      item.directions.push(direction);
    }
    direction.status = 'dated';
    const time = trip.departure.slice(11,19).replace(/:00$/, '');
    const row = {date:trip.departure.slice(0,10),time,arrival:trip.arrival,station:trip.fromStop,address:trip.fromAddress,arrivalStation:trip.toStop,carrier:trip.carrier,service:trip.service,transfer:Boolean(trip.transfer),source:source.url,checkedAt:source.checkedAt};
    if (!direction.trips.some(t => JSON.stringify(t) === JSON.stringify(row))) direction.trips.push(row);
    if (!direction.references.some(r => r.url === source.url)) direction.references.push({url:source.url,label:source.url.includes('likebus.ua')?'LikeBus · перевозчик':source.url.includes('ticket.bus.com.ua')?'BUS.COM.UA · билеты автостанций':'АС «Привокзальная»',checkedAt:source.checkedAt});
    item.days = 'Рейсы на указанные даты';
  }
}

// Record checked sources even when they publish no departure for this pair.
// Unavailable booking forms remain unavailable, not confirmed cancellations.
const bookingPoints = new Map([
  ['UA5110100000','Одесса'],['UA5110600000','Измаил'],['UA5122310100','Килия'],
  ['UA5122310300','Вилково'],['UA5124110100','Рени'],['UA5121410100','Болград'],
  ['UA5120410100','Арциз'],['UA5125010100','Татарбунары'],['UA5110300000','Белгород-Днестровский'],
  ['UA8000000000','Киев'],['UA5124555100','Сарата'],['UA6510100000','Херсон'],
  ['MD0101000000','Кишинёв'],['UA5122080701','Броска'],['UA5125084703','Спасское'],['UA5110800000','Черноморск']
]);
for (const source of snapshot.sources.filter(s=>s.url.startsWith('https://ticket.bus.com.ua/'))) {
  const params = new URL(source.url).searchParams;
  const from = model.canonical(bookingPoints.get(params.get('point_from')));
  const to = model.canonical(bookingPoints.get(params.get('point_to')));
  if (!from || !to) continue;
  const item=merged.get([from,to].map(norm).sort().join('|'));
  const direction=item?.directions.find(d=>model.canonical(d.stops?.[0]?.name)===from && model.canonical(d.stops?.at(-1)?.name)===to);
  if (!direction) continue;
  direction.audit={checkedAt:source.attemptedAt||source.checkedAt, result:source.error||source.lastError?'unavailable':source.trips.length?'published':'no-departures'};
  if (!(source.error||source.lastError) && !direction.references.some(r=>r.url===source.url)) direction.references.push({url:source.url,label:'BUS.COM.UA · билеты автостанций',checkedAt:source.checkedAt});
}

const villages = JSON.parse(fs.readFileSync(path.join(dataDir,'villages.json'),'utf8')).groups.flatMap(g=>g.routes.map(r=>r.id));
const nearbyPlaces = [...new Set([...villages, ...officialReferencePlaces])];
const routes = [...merged.values()]
  .filter(route => route.sources.length || route.directions.some(direction => direction.trips?.length || direction.referenceSchedules?.length))
  .map(route => ({...route, category:model.category(route,nearbyPlaces), directions:route.directions.map(d=>({...d,trips:d.trips.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))}))}))
  .map(route => ({ ...route, sources: [...new Set(route.sources)] }))
  .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

const output = {
  updated: new Date().toISOString().slice(0, 10),
  sourceCheckedAt: snapshot.collectedAt,
  sourceFiles,
  routes
};

fs.writeFileSync(path.join(dataDir, 'regional-routes.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Built ${routes.length} unique regional routes from ${sourceFiles.length} files.`);
