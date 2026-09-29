import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def enrich(records,categories,sources):
 audit=json.loads((ROOT/'directory-audit-20260930.json').read_text(encoding='utf-8'))
 # Individually reviewed rows. Exclude generic registries with conflicting numbers,
 # tarot misfiled as psychotherapy, unidentified providers and unrelated cities.
 selected=[5,13,14,25,36,39,43,44,54,56,58,59,64,86,87,91,93,94,95,96,97,99,100,101,105,106,108,109,110,112,114,115,116,118,120,124,126,129,134,139,147,158,185,188,189,205,206,207,209,210,213,215]
 merge={99:'r28',112:'r31',158:'r32',188:'r215',213:'r77',215:'r76'}
 cat_override={64:'functional',139:'96310'}
 seen={p for r in records for p in r['phones']}
 for i in selected:
  a=audit[i];phones=[p for p in a.get('phones',[]) if p not in seen]
  if not phones:continue
  seen.update(phones)
  source='directory-'+a['url'].rsplit('/',1)[-1]
  sources[source]={'label':'Dovidka.in.ua · Измаил','url':a['url'],'checked':'2026-09-30','kind':'directory'}
  text=a['text'];address=re.search(r'Адреса (.+?)(?: Телефон| 📋| QR-код| 🕐)',text)
  note=(address.group(1).strip()+'. ' if address else '')+'Контакт опубликован в городском каталоге; приём уточните по телефону.'
  if i==36:note='Ортопед-травматолог из Одессы; в каталоге указан приём в Измаиле. Даты приезда уточните.'
  if i==64:note='ЭЭГ · Клименко Ігор Павлович. Запись на функциональную диагностику.'
  if i==14:note='CSD LAB: ул. Ильи Репина, 14; пр. Незалежності, 79. Общий контакт-центр сети.'
  target=next((r for r in records if r['id']==merge.get(i)),None)
  if target:
   target['phones']+=phones;target['note']=target.get('note','')+' '+note;target.setdefault('additionalSources',[]).append(source)
   if i==188:target['phoneLabel']='Регистратура и контакт врача из каталога'
  else:
   records.append({'id':'dovidka-'+a['url'].rsplit('/',1)[-1],'category':cat_override.get(i,a['category']),'name':a['name'],'phones':phones,'city':'Измаил','note':note,'source':source,'phoneLabel':'Контакт для записи из каталога'})
 # Clinic's own published reception number; do not create one copy for each dentist.
 sources['tclinic']={'label':'Официальный сайт Tclinic','url':'https://tclinic.ua/uk/clinic','checked':'2026-09-30','kind':'official'}
 if '0677098144' not in seen:
  records.append({'id':'tclinic','category':'96231','name':'Tclinic · стоматология','phones':['0677098144'],'city':'Измаил','note':'ул. Тульчиановская, 47. Приём взрослых и детей; ортодонтия, хирургия и протезирование.','source':'tclinic','phoneLabel':'Регистратура клиники'})
 sources['statevet']={'label':'ФГИУ · контакт учреждения; сверено с местным обзором ветклиник','url':'https://www.spfu.gov.ua/userfiles/files/Kislica%20OM.pdf','checked':'2026-09-30','kind':'official'}
 if '0484125370' not in seen:
  records.append({'id':'state-vet-izmail','category':'20125','name':'Районная государственная ветеринарная больница','phones':['0484125370'],'city':'Измаил','note':'ул. Вячеслава Черновола (бывшая Чехова), 2. Перед визитом уточните приём животных.','source':'statevet','phoneLabel':'Телефон учреждения'})
 sources['vetcatalog']={'label':'Каталог Veterinarka · Измаил','url':'https://veterinarka.com.ua/ru/vet-clinics/odeska-oblast/izmail','checked':'2026-09-30','kind':'directory'}
 vet_notes={'0968079605':'Heart Vet · ул. Молодёжная, 106.','0984133965':'Vet Патруль · ул. Авраамовская, 76/2.','0971248971':'Кабинет «Ушки на макушке» · ул. Мира, 54.','0971248961':'Кабинет «Ушки на макушке» · ул. Мира, 54.','0971787928':'VetAleX · ул. Греческая, 26.','0736607682':'ZOOline · пр. Незалежності (бывший Суворова), 180.'}
 for r in records:
  if r['category']=='20125':
   for p in r['phones']:
    if p in vet_notes:r['note']=vet_notes[p]+' Время приёма уточните по телефону.';r.setdefault('additionalSources',[]).append('vetcatalog')
  if r['id']=='r213':r['review']={'summary':'На Health24: 5 из 5, один отзыв. Пациентка отмечает внимательность, поддержку и понятные объяснения врача. Краткий пересказ отзыва; это мнение пациента.','label':'Health24 · отзыв о Чебановой Олене Олександрівне','url':'https://h24.ua/doctor/146860-chebanova-olena-oleksandrivna/reviews','checked':'30.09.2026'}
  if r['id']=='r214':r['review']={'summary':'На Health24: 5 из 5, одна оценка. Текстовый комментарий не опубликован.','label':'Health24 · оценка Коренюка Олексія Микитовича','url':'https://h24.ua/doctor/237968-korenyuk-oleksij-mykytovych/reviews','checked':'30.09.2026'}
  if r['id']=='r129':r['review']={'summary':'Оценка клиники ZOOline в каталоге Veterinarka: 4,6 из 5, 146 отзывов. Рейтинг относится ко всей клинике.','label':'Veterinarka · сведения каталога','url':'https://veterinarka.com.ua/ru/vet-clinics/odeska-oblast/izmail','checked':'30.09.2026'}
 # City-specific institutional contacts, verified on their own websites.
 sources['eurotom-bolgrad']={'label':'ЕвроТом · официальный сайт, Болград','url':'https://www.eurotom.in/ru','checked':'2026-09-30','kind':'official'}
 records.append({'id':'eurotom-bolgrad','category':'ct','name':'ЕвроТом · Болград','phones':['0963021534'],'city':'Болград','note':'КТ и УЗИ. ул. Измаильская, 71–75. Исследование и время записи уточните в центре.','source':'eurotom-bolgrad','phoneLabel':'Запись в диагностический центр'})
 for c in categories:
  if not c['media'] or any(m['type']=='video' for m in c['media']):
   slug='psychologist' if c['id']=='96283' else c['id'];path='media/cover-'+slug+'.jpg'
   c['media']=[{'type':'image','src':path,'poster':path}]
