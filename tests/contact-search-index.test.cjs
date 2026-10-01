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
  assert.equal(source.size,526,'audited contact-number coverage');
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
  const panel=transport.match(/<section class="panel" id="individual"[\s\S]*?<\/section>\s*<\/section>/)?.[0];
  assert.ok(panel,'individual trips panel should exist');
  const actual=new Set([...panel.matchAll(/href="tel:\+?([^\"]+)"/g)].map(match=>normalize(match[1])));
  const expected=new Set([
    '0974793137','0982643819','0990165202','0684572215','0734572215',
    '0934282021','0963365739','0680489381','0988412988','0672958217',
    '0982050354','0630483144','0962077144','0679426982','0638025435'
  ].map(normalize));
  assert.deepEqual([...actual].sort(),[...expected].sort());
  assert.equal((panel.match(/← Вернуться в раздел/g)||[]).length,6);
  assert.doesNotMatch(panel,/Вернуться к поездкам|Назад в раздел/);
});

test('transport cover follows the selected section and inner controls share neon feedback',()=>{
  const transport=fs.readFileSync(path.join(root,'transport/index.html'),'utf8');
  assert.match(transport,/<h1 id="coverTitle">/);
  assert.match(transport,/<p id="coverDescription">/);
  const script=[...transport.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)?.[1];
  assert.ok(script,'transport navigation script should exist');
  assert.doesNotThrow(()=>new Function(script),'transport navigation script should parse');
  assert.match(script,/activeTrip[\s\S]*activeContent[\s\S]*activeGroup/);
  assert.match(script,/coverTitle\.textContent=title/);
  const css=fs.readFileSync(path.join(root,'interior-polish.css'),'utf8');
  assert.match(css,/:is\(\.page, \.wrap\) :is\(button, a\[href\], \[role="button"\]\)/);
  assert.match(css,/:is\(\.page, \.wrap\) :is\(\.section-back, \.back-btn, \.inner-back, \.trip-back\)/);
});
