const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'main-v2','index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'main-v2','main.js'),'utf8');
const publicRoot='https://vanku0613-cpu.github.io/telegram-mini-app/';

test('every internal main-menu destination uses the public application host',()=>{
  const targets=[...html.matchAll(/data-nav="([^"]+)"/g)].map(match=>match[1]);
  const internal=targets.filter(target=>!target.startsWith('https://t.me/'));
  assert.ok(internal.length>=9);
  for(const target of internal){
    assert.ok(target.startsWith(publicRoot),`${target} is still a technical relative path`);
  }
  assert.match(html,new RegExp(`href="${publicRoot.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}ukrytia/"`));
  assert.match(html,new RegExp(`href="${publicRoot.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}soglashenie/"`));
});

test('runtime navigation converts legacy relative configuration to public URLs',()=>{
  assert.match(js,/var PUBLIC_APP_ROOT="https:\/\/vanku0613-cpu\.github\.io\/telegram-mini-app\/"/);
  assert.match(js,/function publicAppUrl\(target\)/);
  assert.match(js,/target=publicAppUrl\(target\)/);
  assert.match(js,/window\.location\.href=PUBLIC_APP_ROOT\+"health-care\/#favorites"/);
});
