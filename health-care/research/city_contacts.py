"""Reviewed public clinic contacts. Never duplicate an existing telephone number."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def add_city_contacts(records,sources):
    seen={p for r in records for p in r['phones']}
    added=[]
    for item in json.loads((ROOT/'city-additions-20260930.json').read_text(encoding='utf-8')):
        if any(r['id']==item['id'] for r in records):
            continue
        phones=[p for p in item['phones'] if p not in seen]
        if not phones:
            continue
        record={k:v for k,v in item.items() if k!='url'}
        record['phones']=phones
        record['source']=item['id']
        sources[item['id']]={'label':'Публичная страница учреждения' if item['id']!='web-reni' else 'Одеська РДА · каталог 2025, стр. 203','url':item['url'],'checked':'2026-09-30','kind':'official'}
        records.append(record)
        seen.update(phones)
        added.extend(phones)
    return added

if __name__=='__main__':
    target=ROOT.parent/'data.json'
    data=json.loads(target.read_text(encoding='utf-8'))
    added=add_city_contacts(data['records'],data['sources'])
    for c in data['categories']:
        c['count']=sum(c['id'] in r.get('categories',[r['category']]) for r in data['records'])
    target.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Added unique phones:',len(added),'Records:',len(data['records']))
