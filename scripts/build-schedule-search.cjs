const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const records = [];
const add = (title, meta, href, keywords = '') => records.push({ title, meta, href, keywords });

const cityDir = path.join(root, 'transport', 'city-schedule', 'data');
for (const file of fs.readdirSync(cityDir).filter(name => name.endsWith('.json'))) {
  const cityKey = path.basename(file, '.json');
  const data = JSON.parse(fs.readFileSync(path.join(cityDir, file), 'utf8'));
  const cityName = data.title.replace(/^Расписание\s+/u, '');
  add(cityName, data.subtitle, `./city-schedule/?city=${cityKey}`, `${data.title} ${data.subtitle}`);
  for (const group of data.groups) {
    for (const route of group.routes) {
      const stops = route.directions.flatMap(direction => direction.stops.map(stop => stop.name));
      const times = route.directions.flatMap(direction => direction.departures).slice(0, 8);
      add(
        `${route.id} · ${cityName}`,
        `${group.title} · ${route.name}`,
        `./city-schedule/?city=${cityKey}&group=${encodeURIComponent(group.id)}&route=${encodeURIComponent(route.id)}`,
        [route.days, ...stops, ...times].join(' ')
      );
    }
  }
}

const izmail = JSON.parse(fs.readFileSync(path.join(root, 'transport', 'bus-schedule', 'schedule-data.json'), 'utf8'));
add('Измаил', 'Городские автобусы · 16 маршрутов', './bus-schedule/', 'расписание автобусов измаил');
for (const route of izmail) {
  const headings = route.schedules.flatMap(schedule => schedule.rows[0] || []);
  const stops = route.maps.flatMap(map => map.stops || []);
  add(`Маршрут №${route.id} · Измаил`, headings.join(' ↔ '), `./bus-schedule/?route=${encodeURIComponent(route.id)}`, [route.fare, ...headings, ...stops].join(' '));
}

const odessa = JSON.parse(fs.readFileSync(path.join(root, 'transport', 'odessa-schedule', 'schedule-data.json'), 'utf8'));
add('Одесса', 'Автобусы · троллейбусы · трамваи', './odessa-schedule/', 'городской транспорт расписание одесса');
for (const group of odessa.groups) {
  for (const route of group.routes) {
    const stops = route.directions.flatMap(direction => direction.stops.map(stop => stop.name));
    add(
      `${group.title.replace(/ы$/u, '')} ${route.id} · Одесса`,
      route.name,
      `./odessa-schedule/?group=${encodeURIComponent(group.id)}&route=${encodeURIComponent(route.id)}`,
      [group.title, route.days, ...stops].join(' ')
    );
  }
}

const unique = [...new Map(records.map(record => [`${record.href}|${record.title}`, record])).values()];
fs.writeFileSync(path.join(root, 'transport', 'schedule-search.json'), JSON.stringify({ updated: '01.10.2026', records: unique }));
console.log(`Wrote ${unique.length} searchable schedule records`);
