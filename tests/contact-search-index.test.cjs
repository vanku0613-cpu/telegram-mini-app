const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const normalize=value=>{
  const digits=String(value).replace(/\D/g,'');
  return digits.startsWith('380')?digits.slice(2):digits;
};

test('every published phone contact is reachable from global search',()=>{
  const pages=[
    'communal-services/index.html','products-food/index.html','recreation/index.html',
    'services-masters/index.html','transport/index.html','zags/index.html','ukrytia/index.html'
  ];
  const source=new Set();
  for(const file of pages){
    const html=fs.readFileSync(path.join(root,file),'utf8');
    for(const match of html.matchAll(/href="tel:([^"]+)"/g)){
      if(!match[1].includes('${'))source.add(normalize(match[1]));
    }
  }
  const masters=fs.readFileSync(path.join(root,'services-masters/index.html'),'utf8');
  const masterPhones=new RegExp('\\[(?:\\x27|")(0\\d{9})(?:\\x27|")','g');
  for(const match of masters.matchAll(masterPhones))source.add(normalize(match[1]));
  const healthcare=require('../health-care/data.json');
  for(const record of healthcare.records)for(const phone of record.phones)source.add(normalize(phone));

  const extra=require('../directory-search-extra.json');
  const index=new Set([...healthcare.records,...extra.records].flatMap(record=>record.phones||[]).map(normalize));
  const missing=[...source].filter(phone=>phone&&!index.has(phone));
  assert.deepEqual(missing,[],'phone numbers from app folders must be searchable');
  assert.ok(source.size>=520,'audited contact-number coverage');
  assert.equal(extra.records.filter(record=>(record.phones||[]).includes('0973388892')).length,1,'Dmitry\'s additional phone is indexed once');
});

test('global search combines contacts and the complete transport schedule index',()=>{
  const healthcare=require('../health-care/data.json');
  const extra=require('../directory-search-extra.json');
  const schedule=require('../transport/schedule-search.json');
  const search=fs.readFileSync(path.join(root,'directory-search.js'),'utf8');
  assert.ok(healthcare.records.length+extra.records.length+schedule.records.length>=780,'combined search database size');
  assert.ok(schedule.records.length>=280,'all generated route suggestions remain available');
  assert.match(search,/schedule-search\.json/);
  assert.match(search,/\.\.\.schedule\.records/);
  assert.match(search,/Открыть расписание/);
});

test('contact detail disclosure and shared one-line phone styling are wired to all contact folders',()=>{
  const pages=['communal-services/index.html','products-food/index.html','recreation/index.html','services-masters/index.html','transport/index.html'];
  for(const file of pages)assert.match(fs.readFileSync(path.join(root,file),'utf8'),/contact-details\.js\?v=1/);
  const css=fs.readFileSync(path.join(root,'interior-polish.css'),'utf8');
  assert.match(css,/\.phones > \.phone > strong[\s\S]*?white-space: nowrap/);
  assert.match(css,/\.contact-more > summary/);
  const transport=fs.readFileSync(path.join(root,'transport/index.html'),'utf8');
  assert.doesNotMatch(transport,/Вернуться к поездкам/);
  assert.match(transport,/← Вернуться в раздел/);
});

test('individual trips contains only the discussed trip contacts',()=>{
  const transport=fs.readFileSync(path.join(root,'transport/index.html'),'utf8');
  const taxiMenu=transport.match(/<nav class="tabs taxi-options"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(taxiMenu,'taxi and individual trip folders should share one parent menu');
  assert.match(taxiMenu,/data-content="taxi">[\s\S]*class="trip-icon"[\s\S]*<strong>Такси по городу<\/strong><span>2 службы · 6 номеров<\/span>/);
  assert.match(taxiMenu,/class="trip-folder direct-entry"[^>]*data-content="taxi"/);
  assert.match(transport,/class="[^"]*tab[^"]*has-children[^"]*"[^>]*data-group="taxi"/);
  assert.equal((taxiMenu.match(/class="trip-folder direct-entry"/g)||[]).length,6);
  assert.equal((taxiMenu.match(/data-trip-folder=/g)||[]).length,5);
  assert.match(taxiMenu,/data-trip-folder="izmail-transfer"[\s\S]*5 номеров/);
  assert.match(taxiMenu,/data-trip-folder="izmail-transfer"[\s\S]*Индивидуальные трансферы[\s\S]*По Измаилу · 5 номеров/);
  assert.doesNotMatch(taxiMenu,/family-move|Переезд семьи/);
  assert.equal((taxiMenu.match(/class="trip-icon"/g)||[]).length,6);
  assert.doesNotMatch(taxiMenu,/data-content="individual"/);
  const panel=transport.match(/<section class="panel" id="individual"[\s\S]*?<\/section>\s*<\/section>/)?.[0];
  assert.ok(panel,'individual trips panel should exist');
  const actual=new Set([...panel.matchAll(/href="tel:\+?([^\"]+)"/g)].map(match=>normalize(match[1])));
  const expected=new Set([
    '0974793137','0982643819','0990165202','0684572215','0734572215',
    '0934282021','0963365739','0680489381','0988412988','0672958217',
    '0982050354','0630483144','0962077144','0679426982','0638025435'
  ].map(normalize));
  assert.deepEqual([...actual].sort(),[...expected].sort());
  assert.doesNotMatch(panel,/data-trip-detail="family-move"/);
  assert.match(panel,/Трансфер по Измаилу · Александр/);
  assert.match(transport,/id="groupTabs"[^>]*>[\s\S]*data-group="taxi"[\s\S]*data-content="stations"[\s\S]*data-group="schedule"/);
  assert.match(transport,/data-submenu="schedule"[\s\S]*href="\.\/bus-schedule\/"[\s\S]*<strong>Измаил<\/strong>/);
  assert.match(transport,/Единая база расписаний Бессарабии/);
  assert.match(transport,/id="scheduleSearch"/);
  assert.match(transport,/schedule-search\.json/);
  const schedule=fs.readFileSync(path.join(root,'transport/bus-schedule/index.html'),'utf8');
  assert.match(schedule,/<h1>Расписание автобусов Измаил<\/h1>/);
  assert.match(schedule,/\.route\{[^}]*background:linear-gradient\(145deg,#203c57/,'route buttons that open schedule details use the calm blue-graphite surface');
  assert.match(schedule,/schedule-data\.json/,'the schedule is loaded from the local application data');
  assert.match(schedule,/enterSchedule\(\);if\(route\)showRoute\(route\)/,'Izmail opens the route list without an intermediate folder');
  assert.doesNotMatch(schedule,/izzzzi\.info|Открыть источник/,'the schedule does not expose the source website');
  const scheduleData=JSON.parse(fs.readFileSync(path.join(root,'transport/bus-schedule/schedule-data.json'),'utf8'));
  assert.deepEqual(scheduleData.map(route=>route.id),['1','3','5','7','10','10-А','11','12','14','15','16','17','18','19','22','23']);
  assert.doesNotMatch(panel,/trip-back|← Вернуться в раздел/);
  assert.match(transport,/backs\[1\]\.hidden=\!\(activeGroup\|\|activeContent\|\|activeTrip\)/);
  assert.doesNotMatch(panel,/Вернуться к поездкам|Назад в раздел/);
});

test('transport cover follows the selected section and inner controls share neon feedback',()=>{
  const transport=fs.readFileSync(path.join(root,'transport/index.html'),'utf8');
  const food=fs.readFileSync(path.join(root,'products-food/index.html'),'utf8');
  assert.match(transport,/<h1 id="coverTitle">/);
  assert.match(transport,/<p id="coverDescription">/);
  const script=[...transport.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)?.[1];
  assert.ok(script,'transport navigation script should exist');
  assert.doesNotThrow(()=>new Function(script),'transport navigation script should parse');
  assert.match(script,/activeTrip[\s\S]*activeContent[\s\S]*activeGroup/);
  assert.match(script,/querySelector\(\x27\.trip-copy > span\x27\)/);
  assert.match(script,/coverTitle\.textContent=title/);
  assert.match(transport,/#taxi \.links a\{border-color:#568da8;background:linear-gradient\(180deg,#24516d,#193a52\)/);
  assert.match(transport,/\.taxi-options\{grid-auto-rows:112px[\s\S]*background:linear-gradient\(145deg,rgba\(7,35,65,.94\),rgba\(4,22,42,.97\)\)/);
  assert.match(transport,/\.taxi-options \.trip-folder\{display:grid;grid-template-columns:42px minmax\(0,1fr\) 14px/);
  assert.match(transport,/\.schedule-search input:focus-visible\{outline:0!important/);
  assert.match(transport,/\.schedule-search-label:focus-within,\.schedule-search-label\.tap-lit\{border-color:#57e8ff!important/);
  assert.match(transport,/\.schedule-search-label,\.schedule-search-clear,\.schedule-search-result/);
  assert.match(transport,/#individual \[data-trip-detail="moldova"\] \.links a\{border-color:#568da8/);
  assert.match(food,/\.contact \.links a\{border-color:#568da8;background:linear-gradient\(180deg,#24516d,#193a52\)/);
  assert.match(transport,/chooser\.hidden=Boolean\(activeContent\|\|activeTrip\|\|activeGroup==='schedule'\)/);
  assert.match(script,/groupTabs\.hidden=Boolean\(activeGroup\|\|activeContent\|\|activeTrip\)/);
  const css=fs.readFileSync(path.join(root,'interior-polish.css'),'utf8');
  assert.match(css,/:is\(\.page, \.wrap\) :is\(button, a\[href\], \[role="button"\]\)/);
  assert.match(css,/:is\(\.page, \.wrap\) :is\(\.section-back, \.back-btn, \.inner-back, \.trip-back\)/);
});
