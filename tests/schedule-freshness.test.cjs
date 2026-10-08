const {test}=require('node:test');
const assert=require('node:assert/strict');
const model=require('../transport/city-schedule/schedule-model.js');
const {routes}=require('../transport/city-schedule/data/regional-routes.json');
test('dated trips expire instead of silently becoming daily departures',()=>{
  const d={trips:[{date:'2026-10-09',time:'10:15'}]};
  assert.equal(model.status(d,'2026-10-08'),'dated');
  assert.equal(model.status(d,'2026-10-09'),'dated');
  assert.equal(model.status(d,'2026-10-10'),'expired');
  assert.deepEqual(model.usableTrips(d,'2026-10-10'),[]);
  assert.equal(model.status({trips:[]},'2026-10-08'),'unconfirmed');
});
test('every published departure has a service date, source and boarding location',()=>{
  assert.equal(new Set(routes.map(r=>r.id)).size,routes.length);
  for(const r of routes)for(const d of r.directions){
    assert.deepEqual(d.departures,[],`${d.name}: timeless legacy hours leaked`);
    assert.equal(d.hours,'');assert.equal(d.interval,'');
    for(const t of d.trips){
      assert.match(t.date,/^\d{4}-\d{2}-\d{2}$/);
      assert.match(t.time,/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/);
      assert.match(t.source,/^https:\/\/(likebus\.ua|odessa-bus\.com\.ua|ticket\.bus\.com\.ua)\//);
      assert.ok(t.station && t.checkedAt);
      assert.ok(d.references.some(s=>s.url===t.source));
    }
  }
});
test('route folders distinguish international and local destinations',()=>{
  assert.equal(model.category({places:['Одесса','Кишинёв']}),'international');
  assert.equal(model.category({places:['Измаил','Каменка']},['Каменка']),'nearby');
  assert.equal(model.category({places:['Одесса','Киев']}),'ukraine');
  assert.ok(routes.some(r=>r.places.includes('Одесса')&&r.places.includes('Килия')&&r.directions.some(d=>d.stops[0].name==='Одесса'&&d.trips.length)));
});
