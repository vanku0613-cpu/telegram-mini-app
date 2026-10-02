const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('ferry and border section contains verified contact cards without queue data',()=>{
  const data=JSON.parse(read('bessarabia-online/data.json'));
  assert.deepEqual(Object.keys(data.sections),['border']);
  for(const section of Object.values(data.sections)){
    assert.ok(section.title&&section.subtitle&&section.cards.length);
  }
  assert.deepEqual(Object.keys(data.sourceChecks),['ferry']);
  assert.equal(data.sections.border.cards.length,4);
  assert.doesNotMatch(JSON.stringify(data),/Очереди на границе|traficonline|openstreetmap\.org\/export/);
});

test('only transport links to the ferry and border section',()=>{
  assert.match(read('transport/index.html'),/section=border/);
  for(const file of ['transport/index.html','communal-services/index.html','recreation/index.html','health-care/app.js','zags/index.html']){
    assert.doesNotMatch(read(file),/section=(?:trains|danube|resilience|monitoring|medicines|beaches|cnap)/);
  }
});

test('main menu remains untouched by the preview',()=>{
  const html=read('main-v2/index.html');
  assert.doesNotMatch(html,/bessarabia-online|Граница и паром|Дунай сегодня|Доступные лекарства/);
});

test('global search includes every ferry and border contact',()=>{
  const search=JSON.parse(read('bessarabia-online/search.json'));
  assert.equal(search.records.length,4);
  assert.deepEqual(search.records.map(record=>record.id),['ferry-orlivka-isaccea','ukraine-border-service','isaccea-border-police','moldova-border-police']);
  assert.ok(search.records.every(record=>record.href&&record.name&&record.category));
  assert.equal(new Set(search.records.flatMap(record=>record.phones)).size,6);
});

test('new phone numbers support the shared favorites design',()=>{
  const html=read('bessarabia-online/index.html');
  assert.match(html,/favorites\.css/);
  assert.match(html,/favorites\.js/);
  assert.match(read('bessarabia-online/app.js'),/class="card contact"/);
});

test('ferry section does not render a queue or map',()=>{
  const data=JSON.parse(read('bessarabia-online/data.json'));
  const html=read('bessarabia-online/index.html');
  const app=read('bessarabia-online/app.js');
  assert.equal(data.sections.border.map,undefined);
  assert.doesNotMatch(html,/mapPanel|mapFrame|openstreetmap/);
  assert.doesNotMatch(app,/mapPanel|mapFrame|section\.map/);
});

test('shared city route map uses lightweight embedded tiles and route controls',()=>{
  const routeMap=read('transport/route-map.js');
  for(const file of ['transport/odessa-schedule/index.html','transport/city-schedule/index.html']){
    assert.match(read(file),/\.\.\/route-map\.js\?v=2/);
    assert.match(read(file),/IzmailRouteMap\.mount/);
  }
  assert.match(routeMap,/basemaps\.cartocdn\.com\/light_all/);
  assert.match(routeMap,/Приблизить карту/);
  assert.match(routeMap,/Отдалить карту/);
  assert.match(routeMap,/live-route-line/);
  assert.match(routeMap,/live-route-start/);
  assert.match(routeMap,/live-route-end/);
});

test('Izmail route maps are embedded and allow map zoom controls',()=>{
  const html=read('transport/bus-schedule/index.html');
  const routes=JSON.parse(read('transport/bus-schedule/schedule-data.json'));
  assert.match(html,/frame-src[^>]+https:\/\/www\.google\.com/);
  assert.ok(routes.every(route=>route.maps.length>0));
  assert.ok(routes.flatMap(route=>route.maps).every(map=>/^https:\/\/www\.google\.com\/maps\/d\/embed/.test(map.url)));
});
