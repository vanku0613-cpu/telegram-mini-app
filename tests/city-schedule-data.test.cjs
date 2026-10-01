const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'transport', 'city-schedule', 'data');
const readCity = id => JSON.parse(fs.readFileSync(path.join(dataDir, `${id}.json`), 'utf8'));
const cityIds = fs.readdirSync(dataDir).filter(file => file.endsWith('.json')).map(file => path.basename(file, '.json'));

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

test('city schedule opens details as a separate view and returns to the schedule folder', () => {
  const html = fs.readFileSync(path.join(root, 'transport', 'city-schedule', 'index.html'), 'utf8');
  assert.match(html, /\.\.\/#schedule/);
  assert.match(html, /safeCityKey==='villages'/);
  assert.match(html, /\.\/data\/\$\{safeCityKey\}\.json/);
  assert.match(html, /routeMenu\.hidden=true;routeDetail\.hidden=false/);
  assert.match(html, /data-view="schedule"/);
  assert.match(html, /data-view="map"/);
  assert.match(html, /data-view="stops"/);
});
