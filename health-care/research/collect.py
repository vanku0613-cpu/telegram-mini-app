import json,re,urllib.request,concurrent.futures
from html.parser import HTMLParser
from pathlib import Path
ROOT=Path(__file__).resolve().parent
class N:
 def __init__(self,tag='',attrs=()): self.tag=tag;self.a=dict(attrs);self.children=[]
 def text(self): return ''.join(c if isinstance(c,str) else ('\n' if c.tag=='br' else c.text()) for c in self.children)
 def find(self,p):
  out=[self] if p(self) else []
  for c in self.children:
   if isinstance(c,N): out+=c.find(p)
  return out
class P(HTMLParser):
 def __init__(self,s): super().__init__();self.root=N();self.stack=[self.root];self.feed(s)
 def handle_starttag(self,t,a):
  n=N(t,a);self.stack[-1].children.append(n)
  if t not in ['br','img','meta','link','input','source','hr','wbr']: self.stack.append(n)
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==t: self.stack=self.stack[:i];break
 def handle_data(self,s): self.stack[-1].children.append(s)
def fetch(url):
 req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
 with urllib.request.urlopen(req,timeout=40) as r:return r.read()
def post(url):
 base=url.split('?')[0];raw=fetch(base+'?embed=1').decode();tree=P(raw).root
 ts=tree.find(lambda n:'js-message_text' in n.a.get('class','').split())
 if not ts: return {'url':base,'text':'','links':[],'media':[],'error':'No public message text'}
 t=ts[0];links=[{'name':n.text().strip(),'url':n.a['href']} for n in t.find(lambda n:n.tag=='a' and 'href' in n.a)]
 media=[]
 thumbs=tree.find(lambda n:'tgme_widget_message_video_thumb' in n.a.get('class',''))
 poster=None
 for n in thumbs:
  m=re.search(r"background-image:url\(['\"]?(.*?)['\"]?\)",n.a.get('style',''))
  if m:poster=m.group(1)
 for n in tree.find(lambda n:n.tag in ['video','source']):
  if n.a.get('src'):media.append({'type':'video','url':n.a['src'],'poster':n.a.get('poster') or poster})
 for n in tree.find(lambda n:'tgme_widget_message_photo_wrap' in n.a.get('class','')):
  m=re.search(r"background-image:url\(['\"]?(.*?)['\"]?\)",n.a.get('style',''))
  if m:media.append({'type':'image','url':m.group(1)})
 return {'url':base,'text':t.text(),'links':links,'media':media}
if __name__=='__main__':
 indexes=[post('https://t.me/SPRAVOCHNIK_IZMAIL/'+i) for i in ['96223','96035']]
 categories=[]
 for branch,index in zip(['doctors','beauty'],indexes):
  for l in index['links']:
   if not l['name'] or 'НАЗАД' in l['name'] or 'Справочник' in l['name'] or not re.match(r'https://t.me/[^/]+/\d+',l['url']):continue
   if any(c['url']==l['url'].split('?')[0] for c in categories):continue
   categories.append({'id':l['url'].split('?')[0].split('/')[-1],'branch':branch,'name':l['name'],'url':l['url'].split('?')[0]})
 def get(c):
  try:return dict(c,**{k:v for k,v in post(c['url']).items() if k!='url'})
  except Exception as e:return dict(c,error=str(e))
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: data=list(pool.map(get,categories))
 (ROOT/'telegram.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps([{'id':c['id'],'name':c['name'],'chars':len(c.get('text','')),'media':len(c.get('media',[])),'error':c.get('error')} for c in data],ensure_ascii=False))
