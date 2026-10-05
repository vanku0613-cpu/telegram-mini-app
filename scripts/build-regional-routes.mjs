import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'transport', 'city-schedule', 'data');
const sourceFiles = fs.readdirSync(dataDir)
  .filter(name => name.endsWith('.json') && !['kyiv.json', 'regional-routes.json'].includes(name))
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
  return aliases.get(norm(trimmed)) || trimmed;
};

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

const routes = [...merged.values()]
  .map(route => ({ ...route, sources: [...new Set(route.sources)] }))
  .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

const output = {
  updated: new Date().toISOString().slice(0, 10),
  sourceFiles,
  routes
};

fs.writeFileSync(path.join(dataDir, 'regional-routes.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Built ${routes.length} unique regional routes from ${sourceFiles.length} files.`);
