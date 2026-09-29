from collect import *
data=json.loads((ROOT/'telegram.json').read_text(encoding='utf-8'))
def download(c):
 try:
  if c.get('media') and not c['media'][0].get('poster'): c['media']=post(c['url'])['media']
  for i,m in enumerate(c.get('media',[])):
   name=c['id']+'-'+str(i)+('.mp4' if m['type']=='video' else '.jpg')
   path=ROOT.parent/'media'/name
   if not path.exists():path.write_bytes(fetch(m['url']))
   m['local']='media/'+name
   if m.get('poster'):
    name=c['id']+'-'+str(i)+'-poster.jpg';path=ROOT.parent/'media'/name
    if not path.exists():path.write_bytes(fetch(m['poster']))
    m['localPoster']='media/'+name
  return c
 except Exception as e: c['mediaError']=str(e);return c
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:data=list(pool.map(download,data))
(ROOT/'telegram.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print('categories',len(data),'assets',len(list((ROOT.parent/'media').iterdir())),'bytes',sum(p.stat().st_size for p in (ROOT.parent/'media').iterdir()))
print('errors',[(c['id'],c['mediaError']) for c in data if c.get('mediaError')])
