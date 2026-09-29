import sys,re,json,base64,concurrent.futures
from pathlib import Path
sys.path.insert(0,'health-care/research')
from collect import fetch,P
root=Path('health-care/research')
mapping={'allerholoh':'96311','venerolohiia':'96299','hastroenterolohiia':'96305','hematolohiya':'96313','infektsionist':'96310','kt-kompiuterna-tomohrafiia':'ct','laboratorii-medychni-analizy':'lab','lohoped':'96291','mamolohiia':'96294','medychni-tsentry':'96228','mrt':'96248','nifroloh':'96307','ortopediia':'96260','otolarynholohiia':'96288','psykhiatriia':'96282','psykholohy':'96283','psykhoterapevty':'96284','pulmonoloh':'96306','revmatolohiya':'96274','renthen':'xray','flebolohiia':'96269','ftyziatriya':'phthis','khirurhiia':'96259','stomatology':'96231','hospitals':'96228','polyclinics':'96228','pediatrics':'96230','gynecology':'96292','cardiology':'96264','neurology':'96275','dermatology':'96297','ophthalmology':'96285','ultrasound':'96246','traumatology':'96260','endocrinology':'96304','urology':'96295','oncology':'96294','narcology':'96315'}
urls=[('https://dovidka.in.ua/medycyna/'+slug,cat) for slug,cat in mapping.items()]+[('https://dovidka.in.ua/domashni-tvaryny/'+slug,'20125') for slug in ['veterynary','veterynarn-klnky']]
def listings(pair):
 url,cat=pair
 try:
  tree=P(fetch(url).decode()).root;out=[]
  for a in tree.find(lambda n:n.tag=='article' and 'organization-card' in n.a.get('class','')):
   h=a.find(lambda n:n.tag=='h2');links=h[0].find(lambda n:n.tag=='a') if h else []
   if links:out.append({'category':cat,'name':links[0].text().strip(),'url':'https://dovidka.in.ua'+links[0].a['href']})
  return out
 except Exception:return []
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=[r for group in pool.map(listings,urls) for r in group]
seen=set();rows=[r for r in rows if not (r['url'] in seen or seen.add(r['url']))]
def detail(r):
 try:
  raw=fetch(r['url']).decode();t=P(raw).root
  phones=[]
  for n in t.find(lambda n:('data-p' in n.a) or (n.tag=='a' and n.a.get('href','').startswith('tel:'))):
   phone=base64.b64decode(n.a['data-p']).decode() if 'data-p' in n.a else n.a['href'][4:]
   phone=re.sub(r'\D','',phone);phone=phone[2:] if phone.startswith('380') else phone
   if re.fullmatch(r'0\d{9}',phone) and phone not in phones:phones.append(phone)
  for n in t.find(lambda n:n.tag in ['script','style','nav','footer']):n.children=[]
  text=re.sub(r'\s+',' ',t.text());start=text.find('Про організацію');end=text.find('QR-код',start);desc=text[start:end] if start>=0 and end>start else text
  r.update(phones=phones,text=desc[:5000]);return r
 except Exception as e:r['error']=str(e);return r
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(detail,rows))
(root/'directory-audit-20260930.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
existing={p for r in json.loads(Path('health-care/data.json').read_text(encoding='utf-8'))['records'] for p in r['phones']}
for r in results:
 new=[p for p in r.get('phones',[]) if p not in existing]
 if new:print(json.dumps(dict(category=r['category'],name=r['name'],new=new,text=r['text'][:500],url=r['url']),ensure_ascii=False))
print('Reviewed',len(results),'listings')
