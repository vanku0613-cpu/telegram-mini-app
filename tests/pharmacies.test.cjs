const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pharmacies = require('../health-care/pharmacies.json');

test('Izmail pharmacy catalog keeps complete sourced cards and local imagery', () => {
  assert.equal(pharmacies.records.length, 44);
  assert.equal(new Set(pharmacies.records.map(record => record.id)).size, 44);
  assert.equal(pharmacies.categories[0].count, 44);
  for (const record of pharmacies.records) {
    assert.equal(record.city, 'Измаил');
    assert.ok(record.name);
    assert.ok(record.address || record.coordinates);
    assert.match(record.sourceUrl, /^https:\/\/dovidka\.in\.ua\//);
    assert.match(record.image, /^media\/pharmacies\/.+\.webp$/);
    assert.ok(fs.statSync(path.join(root, 'health-care', record.image)).size > 1000);
    for (const phone of record.phones) assert.match(phone, /^(?:0\d{9}|5900)$/);
    if (record.phones.length) {
      assert.equal(record.phoneChecked, '2026-10-08');
      for (const phone of record.phones) {
        assert.ok(record.phoneNotes[phone]);
        assert.match(record.phoneSources[phone], /^https:\/\//);
      }
    }
  }
  const withPhones = pharmacies.records.filter(record => record.phones.length);
  assert.equal(withPhones.length, 34);
  assert.equal(withPhones.reduce((count, record) => count + record.phones.length, 0), 36);
  assert.deepEqual(pharmacies.records.find(record => record.id === 'pharmacy-farmacia').phones, ['0484159513', '0503959720']);
  assert.deepEqual(pharmacies.records.find(record => record.id === 'pharmacy-bazhayemo-zdorov-ya-2').phones, ['0936098852']);
  assert.deepEqual(pharmacies.records.find(record => record.id === 'pharmacy-podorozhnyk').phones, ['0678250840']);
  assert.deepEqual(pharmacies.records.find(record => record.id === 'pharmacy-apteka-ants').phones, ['5900']);
});

test('pharmacies are connected to the health folder and global search', () => {
  const app = fs.readFileSync(path.join(root, 'health-care/app.js'), 'utf8');
  const search = fs.readFileSync(path.join(root, 'directory-search.js'), 'utf8');
  assert.match(app, /medical:'Врачи и здоровье',doctors:'Врачи',pharmacies:'Аптеки Измаила'/);
  assert.match(app, /branchBack=branch==='doctors'\|\|branch==='pharmacies'\?'#medical':'#'/);
  assert.match(app, /pharmacies\.json\?v=20261008-2/);
  assert.match(app, /<details class="pharmacy-details">/);
  assert.match(app, /class="pharmacy-detail-phone"/);
  assert.match(app, /Подтверждённый телефон пока не найден/);
  assert.doesNotMatch(app, /class="pharmacy-source"/);
  assert.match(search, /pharmacies\.json\?v=20261008-2/);
  const style = fs.readFileSync(path.join(root, 'health-care/style.css'), 'utf8');
  assert.match(style, /body\[data-pharmacies=true\] \.contact-list\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.ok(fs.statSync(path.join(root, 'assets', 'health-pharmacies-cover-v1.webp')).size > 1000);
});
