const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const health = require('../health-care/data.json');
const extra = require('../directory-search-extra.json');
const normalize = value => String(value || '').replace(/\D/g, '').replace(/^380/, '0');
const recordsForPhone = phone => health.records.filter(record =>
  (record.phones || []).some(value => normalize(value) === normalize(phone))
);

const newlyPublishedDoctors = [
  '0677230363', '0937468376', '0637867626', '0979460740', '0667502560',
  '0675589585', '0973481001', '0686873292', '0968125974', '0672505326',
  '0973905390', '0991416756', '0631216013', '0632033290', '0679575960',
  '0950600898', '0665649849', '0967966038', '0964351990', '0971143380',
  '0971559619', '0974098506', '0974175402', '0977335139', '0979530063',
  '0979723084', '0982447400', '0985680280', '0505457078', '0992482604',
  '0973450194'
];

const newlyPublishedVets = ['0671991391', '0930136952', '0994082672', '0974902535'];
const newlyPublishedUtilities = ['0979442113', '0484122075', '0484120024', '0951329780'];

test('archive doctors and veterinarians are published once and assigned to a city', () => {
  for (const phone of [...newlyPublishedDoctors, ...newlyPublishedVets]) {
    const matches = recordsForPhone(phone);
    assert.equal(matches.length, 1, `${phone} must occur in exactly one contact card`);
    assert.equal(matches[0].city, 'Измаил', `${phone} must be assigned to Измаил`);
  }

  const kiliyaUltrasound = recordsForPhone('0689549674');
  assert.equal(kiliyaUltrasound.length, 1);
  assert.equal(kiliyaUltrasound[0].city, 'Килия');
  assert.ok(kiliyaUltrasound[0].categories.includes('96246'));
  assert.match(kiliyaUltrasound[0].note, /имя специалиста.*не указано/i);

  assert.equal(recordsForPhone('0680746169').length, 0, 'uncertain Bolgrad location is not guessed');
});

test('new utility contacts are visible and included in global search', () => {
  const html = fs.readFileSync(path.join(root, 'communal-services/index.html'), 'utf8');
  const searchPhones = new Set(extra.records.flatMap(record => record.phones || []).map(normalize));
  for (const phone of newlyPublishedUtilities) {
    const tel = phone.startsWith('0') ? `+380${phone.slice(1)}` : phone;
    assert.equal(html.split(`href="tel:${tel}"`).length - 1, 1, `${phone} utility card`);
    assert.ok(searchPhones.has(phone), `${phone} global search record`);
  }
  assert.match(html, /https:\/\/www\.viber\.com\/izmailvoda/);
  assert.match(html, /https:\/\/odgaz\.odessa\.ua\/abon-depart/);
});

test('contact databases and cache versions point to the new release', () => {
  const search = fs.readFileSync(path.join(root, 'directory-search.js'), 'utf8');
  const healthApp = fs.readFileSync(path.join(root, 'health-care/app.js'), 'utf8');
  const healthPage = fs.readFileSync(path.join(root, 'health-care/index.html'), 'utf8');
  const home = fs.readFileSync(path.join(root, 'main-v2/index.html'), 'utf8');
  assert.match(search, /data\.json\?v=20261004-1/);
  assert.match(search, /directory-search-extra\.json\?v=20261004-1/);
  assert.match(healthApp, /data\.json\?v=20261004-1/);
  assert.match(healthPage, /app\.js\?v=20261004-1/);
  assert.match(home, /directory-search\.js\?v=20/);
});
