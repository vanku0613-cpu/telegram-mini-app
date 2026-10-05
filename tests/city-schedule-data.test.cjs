const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'transport', 'city-schedule', 'data');
const readCity = id => JSON.parse(fs.readFileSync(path.join(dataDir, `${id}.json`), 'utf8'));
const cityIds = fs.readdirSync(dataDir).filter(file => file.endsWith('.json') && file !== 'regional-routes.json').map(file => path.basename(file, '.json'));

test('schedule directory contains every requested confirmed city and Izmail district villages', () => {
  assert.deepEqual(cityIds.sort(), [
    'artsyz', 'bilhorod', 'bolgrad', 'kiliya', 'kyiv', 'reni', 'tatarbunary', 'vilkove', 'villages'
  ]);
  const villageRoutes = readCity('villages').groups.flatMap(group => group.routes);
  assert.equal(villageRoutes.length, 19);
  for (const expected of ['Сафьяны', 'Матроска', 'Старая Некрасовка', 'Озёрное', 'Утконосовка']) {
    assert.ok(villageRoutes.some(route => route.id === expected), `${expected} is missing`);
  }
});

test('every regional route has readable times and usable map endpoints', () => {
  for (const cityId of cityIds) {
    const city = readCity(cityId);
    assert.ok(city.title && city.subtitle && city.groups.length, `${cityId} has no visible sections`);
    for (const group of city.groups) {
      assert.ok(group.title && group.routes.length, `${cityId}/${group.id} is empty`);
      for (const route of group.routes) {
        assert.ok(route.id && route.name && route.directions.length, `${cityId}/${route.id} is incomplete`);
        for (const direction of route.directions) {
          assert.ok(direction.departures.length || direction.hours, `${cityId}/${route.id} has no schedule`);
          assert.ok(direction.stops.length >= 2, `${cityId}/${route.id} has no map endpoints`);
          assert.ok(direction.shape.length >= 2, `${cityId}/${route.id} has no route line`);
        }
      }
    }
  }
});

test('Kyiv schedule is built from the official GTFS transport set', () => {
  const counts = Object.fromEntries(readCity('kyiv').groups.map(group => [group.id, group.routes.length]));
  assert.ok(counts.bus >= 100);
  assert.ok(counts.trolleybus >= 40);
  assert.ok(counts.tram >= 17);
});

test('Vylkove schedule exposes the verified Bessarabia directions', () => {
  const vilkove = readCity('vilkove');
  const routes = vilkove.groups.flatMap(group => group.routes);
  for (const expected of ['Килия', 'Измаил', 'Татарбунары', 'Сарата', 'Белгород-Днестровский', 'Одесса', 'Киев']) {
    assert.ok(routes.some(route => route.id === expected), `${expected} is missing from Vylkove`);
  }
  assert.deepEqual(routes.find(route => route.id === 'Одесса').directions[0].departures, ['18:00']);
  assert.deepEqual(routes.find(route => route.id === 'Килия').directions[0].departures, ['09:35']);
});

test('city schedule opens details as a separate view and returns to the schedule folder', () => {
  const html = fs.readFileSync(path.join(root, 'transport', 'city-schedule', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'transport', 'city-schedule', 'app.js'), 'utf8');
  assert.match(app, /\.\.\/#schedule/);
  assert.match(app, /safeCityKey==='villages'/);
  assert.match(app, /\.\/data\/\$\{safeCityKey\}\.json/);
  assert.match(app, /routeMenu\.hidden=true;routeDetail\.hidden=false/);
  assert.match(html, /data-view="schedule"/);
  assert.match(html, /data-view="map"/);
  assert.match(html, /data-view="stops"/);
  assert.match(app, /regional-routes\.json\?v=20261005-1/);
  assert.match(app, /usesTransportTypes=safeCityKey==='kyiv'/);
  assert.match(app, /usesTransportTypes\?'Виды транспорта':'Вернуться в раздел'/);
  assert.match(html, /<button class="route-return"[^>]*id="backToRoutes"[^>]*>[\s\S]*?К расписанию<\/button>/);
});

test('regional routes are unique and visible from every matching city or village', () => {
  const regional = readCity('regional-routes').routes;
  assert.equal(regional.length, 61);
  assert.equal(new Set(regional.map(route => route.id)).size, regional.length, 'regional route pairs must not repeat');
  const izmailUtkonosivka = regional.filter(route => route.places.includes('Измаил') && route.places.includes('Утконосовка'));
  assert.equal(izmailUtkonosivka.length, 1, 'Izmail and Utkonosivka share one route record');
  const novoselivka = regional.filter(route => route.places.includes('Новосёловка'));
  assert.deepEqual(novoselivka.map(route => route.places.slice().sort()).sort(), [
    ['Измаил', 'Новосёловка'].sort(),
    ['Килия', 'Новосёловка'].sort()
  ].sort());
});

test('schedule cards use the refreshed city and village artwork', () => {
  const directory = fs.readFileSync(path.join(root, 'transport', 'index.html'), 'utf8');
  const cityPage = fs.readFileSync(path.join(root, 'transport', 'city-schedule', 'index.html'), 'utf8');
  const cityApp = fs.readFileSync(path.join(root, 'transport', 'city-schedule', 'app.js'), 'utf8');
  const cityAssets = ['izmail', 'odesa', 'kiliya', 'vilkove', 'reni', 'bolgrad', 'artsyz', 'tatarbunary', 'bilhorod', 'kyiv'];
  for (const city of cityAssets) {
    assert.ok(fs.existsSync(path.join(root, 'assets', 'schedule-cities', `${city}-v2.webp`)), `${city} cover is missing`);
    assert.match(directory, new RegExp(`schedule-cities/${city}-v2\\.webp\\?v=2`));
  }

  const villages = readCity('villages').groups.flatMap(group => group.routes).map(route => route.id);
  const mappingSource = cityApp.match(/const villagePhotos=(\{[^;]+\});/)?.[1];
  assert.ok(mappingSource, 'village photo mapping is missing');
  const mapping = Function(`return ${mappingSource}`)();
  assert.deepEqual(Object.keys(mapping).sort(), villages.sort());
  assert.equal(new Set(Object.values(mapping)).size, villages.length, 'every village needs its own image');
  for (const slug of Object.values(mapping)) {
    assert.ok(fs.existsSync(path.join(root, 'assets', 'schedule-villages', `${slug}.webp`)), `${slug} artwork is missing`);
  }
  assert.match(cityApp, /class=\"village-route-photo\"/);
  assert.match(cityApp, /class=\"village-route-icon\"/);
  assert.match(cityPage, /\.village-route-name\{[^}]*top:50%[^}]*text-align:center/);
  assert.match(directory, /\.schedule-city-photo\{[^}]*brightness\(\.96\)/, 'city photos should stay clearly visible');
  assert.match(directory, /\.schedule-city-card:after\{[^}]*rgba\(2,15,31,\.48\)/, 'text overlay must not black out the city');
  assert.match(directory, /city=bilhorod[^}]*\.schedule-city-copy\{left:43px;right:23px\}/, 'Bilhorod label should clear the icon');
  assert.match(directory, /city=tatarbunary[^}]*\.schedule-city-copy\{transform:translateY\(6px\)\}/, 'Tatarbunary label should sit below the icon');
});
