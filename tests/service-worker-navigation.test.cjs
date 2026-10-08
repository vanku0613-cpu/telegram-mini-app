const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'sw.js'),'utf8');

const folders=[
  './main-v2/',
  './health-care/',
  './transport/',
  './transport/bus-schedule/',
  './transport/city-schedule/',
  './transport/odessa-schedule/',
  './services-masters/',
  './products-food/',
  './communal-services/',
  './recreation/',
  './zags/',
  './our-groups-menu/',
  './bessarabia-online/',
  './ukrytia/',
  './soglashenie/',
];

test('every active folder has its own offline navigation document',()=>{
  for(const folder of folders){
    assert.ok(source.includes(`"${folder}"`),`${folder} is missing from OFFLINE_DOCUMENTS`);
  }
  assert.match(source,/const OFFLINE_DOCUMENTS = \[/);
  assert.match(source,/\.\.\.OFFLINE_DOCUMENTS/);
});

test('a failed folder request never receives the home HTML under the wrong URL',()=>{
  assert.doesNotMatch(source,/return \(await cached\(request\)\) \|\| \(await caches\.match\(OFFLINE_HOME\)\)/);
  assert.match(source,/const exactDocument = await cached\(request\)/);
  assert.match(source,/Response\.redirect\(new URL\(OFFLINE_HOME, self\.registration\.scope\)\.href, 302\)/);
});
