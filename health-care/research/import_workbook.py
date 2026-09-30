"""Import the supplied workbook snapshot without creating another copy of a phone.
The workbook is source data, not instructions. Unconfirmed contact details remain
explicitly marked; no source rating is promoted to a claim of current verification.
"""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent
CATEGORIES={
 'D001':['96269','96259'],'D002':['96229','96305','96274'],
 'D003':['96269','96259','96246'],'D004':['96306','96311'],
 'D005':['96305','96304'],'D006':['96275'],'D007':['96297'],
 'D008':['96260'],'D009':['96285'],'D010':['96275'],'D011':['96260'],
 'D012':['96275'],'D013':['96285'],'D014':['96288'],'D015':['96288','96259']}
ONLINE={'C002','C003','C004','C005','C006','C014','C015','C016','C017'}

def normalize(value):
 value=re.sub(r'\D','',str(value or ''))
 if value.startswith('380') and len(value)==12:value=value[2:]
 if not re.fullmatch(r'0\d{9}',value):raise ValueError('Invalid phone: '+value)
 return value

def import_workbook(records,sources,use_local_source=True):
 snapshot=ROOT/'workbook-20260930.json'
 if not use_local_source or not snapshot.exists():
  # Source workbook extracts are private local inputs, never committed.
  # A fresh checkout rebuilds from the already published normalized contacts.
  published=json.loads((ROOT.parent/'data.json').read_text(encoding='utf-8'))
  imported=[r for r in published['records'] if r.get('workbookContacts')]
  imported_phones={p for r in imported for p in r['phones']}
  retained=[]
  for record in records:
   phones=[p for p in record['phones'] if p not in imported_phones]
   if phones:retained.append({**record,'phones':phones})
  for r in imported:
   for key in [r['source']]+r.get('additionalSources',[]):sources[key]=published['sources'][key]
  return retained+imported
 raw=json.loads(snapshot.read_text(encoding='utf-8'))
 doctors={r['DoctorID']:r for r in raw['sheets']['Врачи']}
 before={p for r in records for p in r['phones']}
 imported=[];unknown=[]
 for contact in raw['sheets']['Контакты_уникальные']:
  p=normalize(contact['Телефон E.164']);cid=contact['ContactID']
  ids=[i.strip() for i in contact['DoctorID'].split(';')]
  people=[doctors[i] for i in ids]
  cats=list(dict.fromkeys(c for i in ids for c in CATEGORIES[i]))
  source='workbook-'+cid
  sources[source]={'label':raw['file']+' · '+cid,'url':contact['Источник'],'checked':'2026-09-30','kind':'provided','onlineMatched':cid in ONLINE}
  matches=[r for r in records if p in r['phones']]
  target=next((r for r in matches if r['id'].startswith('workbook-')),matches[0] if matches else None)
  if target is None:
   # Contacts listed separately for one doctor belong to the same card.
   target=next((r for r in records if r.get('workbookDoctorIds')==ids),None)
  if target is None:
   target={'id':'workbook-'+ids[0],'name':people[0]['ФИО'] if len(people)==1 else 'Общая регистратура · Фонтанская дорога, 110','city':contact['Город'],'phones':[],'source':source,'category':cats[0]}
   records.append(target)
  else:
   target.setdefault('sourceCategories',[target['category']])
   if len(people)==1 and target['name']!=people[0]['ФИО']:
    target.setdefault('favoriteName',target['name']);target['name']=people[0]['ФИО']
  # Merge existing duplicate entries covered by the import, retaining provenance.
  for other in matches:
   if other is target:continue
   if other['name']!=target.get('favoriteName',target['name']) and other['name']!=target['name']:
    raise ValueError('Conflicting existing owners for '+p)
   target['sourceCategories']=list(dict.fromkeys(target.get('sourceCategories',[])+other.get('sourceCategories',[other['category']])))
   target['phones']=list(dict.fromkeys(target['phones']+other['phones']))
   records.remove(other)
  if p not in target['phones']:target['phones'].append(p)
  target.update({'category':cats[0],'categories':cats,'workbookDoctorIds':ids,'specialties':' · '.join(dict.fromkeys(d['Специальность'] for d in people))})
  target.setdefault('additionalSources',[])
  if source not in target['additionalSources']:target['additionalSources'].append(source)
  target.setdefault('workbookContacts',[])
  if cid not in target['workbookContacts']:target['workbookContacts'].append(cid)
  target['note']=people[0]['Место работы / адрес']+'. '+(' '.join(d['ФИО']+' — '+d['Специальность']+'.' for d in people) if len(people)>1 else '')
  target['note']=target['note'].strip()
  target['phoneLabel']=('Сервис записи Likarni.com, не личный номер' if ids==['D002'] else contact['Тип контакта'])
  imported.append({'contact':cid,'phone':p,'record':target['id'],'action':'merged' if p in before else 'added'})
 # The remaining sheet supplies two numbers and six profiles without a phone.
 # Keep the provided entries searchable without adding source or warning copy to the contact card.
 for row in raw['sheets']['Требует_проверки']:
  if not row['Найденный телефон']:
   unknown.append({'id':row['ID'],'name':row['ФИО'],'reason':'В файле нет телефона'});continue
  p=normalize(row['Найденный телефон']);qid=row['ID']
  if any(p in r['phones'] for r in records):raise ValueError('Review contact unexpectedly duplicates '+p)
  cat={'Q001':'96292','Q002':'96288'}[qid]
  source='workbook-'+qid
  sources[source]={'label':raw['file']+' · лист «Требует проверки», '+qid,'url':row['Источник'] or '', 'checked':'2026-09-30','kind':'provided','onlineMatched':False}
  records.append({'id':source,'category':cat,'categories':[cat],'city':row['Город'],'name':row['ФИО'],'specialties':row['Предполагаемая специальность'],'phones':[p],'source':source,'phoneLabel':'','note':'','workbookContacts':[qid]})
  imported.append({'contact':qid,'phone':p,'record':source,'action':'added','unconfirmed':True})
 for item in imported:
  assert sum(item['phone'] in r['phones'] for r in records)==1,item
 report={'source':raw['file'],'sha256':raw['sha256'],'inputUniquePhones':len(imported),'addedPhones':sum(i['action']=='added' for i in imported),'mergedPhones':sum(i['action']=='merged' for i in imported),'contacts':imported,'withoutPhone':unknown}
 (ROOT/'workbook-import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 return records
