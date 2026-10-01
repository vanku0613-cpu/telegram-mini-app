const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('Odessa schedule contains the three requested transport sections', () => {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'transport', 'odessa-schedule', 'schedule-data.json'), 'utf8'));
  assert.deepEqual(data.groups.map(group => [group.id, group.routes.length, group.fare]), [
    ['bus', 6, 'Бесплатно'],
    ['trolleybus', 7, '15 грн'],
    ['tram', 18, '15 грн']
  ]);
  for (const group of data.groups) {
    for (const route of group.routes) {
      assert.ok(route.id && route.name && route.days);
      assert.equal(route.directions.length, 2);
      for (const direction of route.directions) {
        assert.ok(direction.name);
        assert.ok(direction.stops.length >= 2, `${group.id} ${route.id} must include stops`);
        assert.ok(direction.shape.length >= 2, `${group.id} ${route.id} must include a map shape`);
        assert.ok(direction.hours || direction.departures.length, `${group.id} ${route.id} must include usable schedule information`);
      }
    }
  }
});

test('transport menu groups Izmail and Odessa inside the schedule folder', () => {
  const transport = fs.readFileSync(path.join(root, 'transport', 'index.html'), 'utf8');
  const schedule = fs.readFileSync(path.join(root, 'transport', 'odessa-schedule', 'index.html'), 'utf8');
  assert.match(transport, /data-group="schedule"/);
  assert.match(transport, /id="groupTabs"[\s\S]*data-group="taxi"[\s\S]*data-content="stations"[\s\S]*class="tab directory-tab schedule-card has-children"/);
  assert.match(transport, /#groupTabs\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(transport, /\.schedule-card\{grid-column:1\/-1/);
  assert.match(transport, /class="menu-card-icon"/);
  assert.match(transport, /<strong>Расписание<\/strong><span>Единая база расписаний Бессарабии<\/span>/);
  assert.match(transport, /data-submenu="schedule"/);
  assert.match(transport, /href="\.\/bus-schedule\/"/);
  assert.match(transport, /href="\.\/odessa-schedule\/"/);
  assert.match(transport, /city=villages/);
  assert.match(transport, /Сёла Измаильского района/);
  assert.match(schedule, /Автобусы · троллейбусы · трамваи/);
  assert.match(schedule, /data-view="schedule"/);
  assert.match(schedule, /data-view="map"/);
  assert.match(schedule, /data-view="stops"/);
  assert.match(schedule, /К расписанию/);
});
