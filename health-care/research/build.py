from collect import *
data=json.loads((ROOT/'telegram.json').read_text(encoding='utf-8'))
categories=[{'id':c['id'],'branch':c['branch'],'name':c['name'],'media':[{'type':m['type'],'src':m['local'],'poster':m.get('localPoster')} for m in c.get('media',[])],'source':c['url']} for c in data]
cats={c['id']:c for c in categories}; records=[]
sources={'telegram':{'label':'Подборка справочника','checked':'2026-09-30','kind':'community'},
 'hospital':{'label':'Сайт городской центральной больницы','url':'https://izmailcml.org.ua/контакты/','checked':'2026-09-30','kind':'official'},
 'doctors':{'label':'Сайт МЦЛ · список специалистов','url':'https://izmailcml.org.ua/безкоштовні-послуги/','checked':'2026-09-30','kind':'official'},
 'primary':{'label':'Сайт городского центра ПМСП','url':'https://izm.pmsd.org.ua/kontaktna-informatsiya/','checked':'2026-09-30','kind':'official'},
 'eurotom':{'label':'Сайт «ЄвроТом»','url':'https://www.eurotom.in/','checked':'2026-09-30','kind':'official'},
 'ukrmedtrans':{'label':'Сайт «Укрмедтранс»','url':'https://ukrmedtrans.com/contacts','checked':'2026-09-30','kind':'official'},
 'lileya':{'label':'Сайт «Лілея»','url':'https://lileyamed.com.ua/contact/','checked':'2026-09-30','kind':'official'},
 'healthhub':{'label':'Каталог UZDInfo','url':'https://uzdinfo.com.ua/ru/health-hub-izmail-uzd-clinic-1301','checked':'2026-09-30','kind':'directory'}}
def add(cat,name,phones,city='Измаил',note='',source='telegram',phoneLabel='Контакт из подборки'):
 next_id=max((int(r['id'][1:]) for r in records),default=0)+1
 records.append({'id':'r'+str(next_id),'category':cat,'name':name,'phones':list(dict.fromkeys(phones.split(','))),'city':city,'note':note,'source':source,'phoneLabel':phoneLabel})
for line in (ROOT/'contacts.tsv').read_text(encoding='utf-8').splitlines():
 cat,name,phones,city,note=line.split('|');add(cat,name,phones,city,note)
sources['nszu']={'label':'Кабмин · информация МОЗ, 22.05.2026','url':'https://www.kmu.gov.ua/news/tsentry-mentalnoho-zdorovia-psykholohichna-dopomoha-dlia-ponad-120-tysiach-ukraintsiv-na-rik','checked':'2026-09-30','kind':'official'}
add('96228','НСЗУ · помощь с поиском медицинских услуг','1677','Украина','Общая справочная линия; не номер врача','nszu','Контакт-центр')
sources['laserhouse']={'label':'Сайт «Лазерхауз» · Измаил','url':'https://www.laserhouse.com.ua/ua/trix_ism','checked':'2026-09-30','kind':'official'}
for cat,note in [('96300','Консультация трихолога'),('96048','Консультация косметолога'),('96052','Уходовые процедуры')]:
 add(cat,'Лазерхауз · запись','0731771631',note=note+'. ул. Гетмана Мазепы (Чернышевского), 24',source='laserhouse',phoneLabel='Запись в центр')
add('96314','Томев Иван Иванович','0672929451',note='Хирург-онколог. Перенесён также из категории «Хирург»')
for id,name in [('ct','КТ-диагностика'),('lab','Анализы и лаборатории'),('palliative','Паллиативная помощь'),('phthis','Фтизиатр'),('functional','Функциональная диагностика'),('trust','Кабинет «Довіра»'),('xray','Рентгенологи'),('sports','Спортивная медицина')]:
 c={'id':id,'name':name,'branch':'doctors','media':[]};categories.append(c);cats[id]=c
cats['96046']['name']='Маникюр и педикюр'
cats['96231']['name']='Стоматологи · взрослые и детские'
cats['20125']['name']='Ветеринары Измаила'
cats['96246']['name']='УЗИ / УЗД'
cats['96260']['name']='Травматологи и ортопеды'
for cat,name,phone,note in [
 ('96228','МЦЛ · приёмное отделение','0688827845','пр. Незалежності, 68'),
 ('96228','МЦЛ · канцелярия','0965934789','пр. Незалежності, 68'),
 ('96228','МЦЛ · администратор экспертной команды','0688568446','Вопросы оценивания повседневного функционирования'),
 ('96228','МЦЛ · взрослая поликлиника','0965892698','ул. Клушина, 6'),
 ('96230','МЦЛ · детская поликлиника','0989434806','Регистратура; адрес кабинета уточнить при записи'),
 ('ct','МЦЛ · запись на КТ','0964077471','Адрес кабинета уточнить при записи'),
 ('96275','МЦЛ · неврологическое отделение','0979875325','Контакт отделения'),
 ('96259','МЦЛ · хирургическое отделение','0689796356','Контакт отделения'),
 ('96260','МЦЛ · травматологическое отделение','0973726491','Контакт отделения'),
 ('96263','МЦЛ · реанимация и интенсивная терапия','0686532573','Контакт отделения'),
 ('palliative','МЦЛ · паллиативное отделение','0679467052','Контакт отделения'),
 ('96292','МЦЛ · женская консультация','0962359085','Регистратура'),
 ('lab','МЦЛ · биохимическая лаборатория','0975175351','Поликлиника'),
 ('96231','МЦЛ · стоматологическая поликлиника','0970087736','Регистратура')]:add(cat,name,phone,note=note,source='hospital',phoneLabel='Телефон учреждения')
for cat,name,phone,note in [
 ('96229','Центр ПМСП · регистратура на Клушина','0672984090,0962847096','ул. Клушина, 6'),
 ('96230','Центр ПМСП · регистратура на Шевченко','0672984060','ул. Шевченко, 8'),
 ('96229','Центр ПМСП · Придунайская','0672984014','ул. Придунайская, 212 и 435'),
 ('96228','Центр ПМСП · приёмная','0484164564','ул. Шевченко, 8')]:add(cat,name,phone,note=note,source='primary',phoneLabel='Телефон учреждения')
for cat,name,phones,note,src in [
 ('96248','ЄвроТом · МРТ','0970676991,0994959919','ул. Белгород-Днестровская, 31, территория районной больницы','eurotom'),
 ('ct','ЄвроТом · КТ','0983313686,0950719523','ул. Мистецька (Осипенко), 59а','eurotom'),
 ('96228','Укрмедтранс · медицинский центр','0636564746,0689708503','ул. Национальной гвардии Украины, 48','ukrmedtrans'),
 ('96292','Лілея · медицинский центр','0637468376,0967145622','ул. Ильи Репина, 14-а, 2 этаж','lileya'),
 ('96246','Health Hub · УЗИ','0979389970','пр. Мира, 52. Данные открытого каталога; уточнить при записи','healthhub')]:add(cat,name,phones,note=note,source=src,phoneLabel='Запись в учреждение')
# Read the actual table cells, retaining the relationship between doctor and specialty.
tree=P((ROOT/'hospital-doctors.html').read_text(encoding='utf-8')).root
tables=tree.find(lambda n:n.tag=='table')
maps=[('нарколог','96315'),('ультразвук','96246'),('Довіра','trust'),('гастро','96305'),('травмат','96260'),('хірург','96259'),('уролог','96295'),('онколог','96294'),('гематолог','96313'),('кардіо','96264'),('невролог','96275'),('невропат','96275'),('отоларинг','96288'),('дерматовен','96299'),('офтальм','96285'),('стоматолог','96231'),('гінеколог','96292'),('генетик','96318'),('УЗД','96246'),('фтизіатр','phthis'),('-ФД','functional')]
maps += [('рентгенолог','xray'),('спорт','sports')]
for ti,table in enumerate(tables):
 for row in table.find(lambda n:n.tag=='tr'):
  cells=[re.sub(r'\s+',' ',n.text()).strip() for n in row.find(lambda n:n.tag in ['td','th'])]
  if len(cells)<4 or not cells[0].isdigit():continue
  spec,name=cells[1:3]
  if not name:continue
  if 'стоматолог' in spec:cat='96231'
  elif 'гінеколог' in spec or 'ак.-гін' in spec:cat='96292'
  else:cat=next((v for k,v in maps if k in spec),None)
  if not cat:continue
  child=ti==1; dental=ti==2;women=ti==3
  phone='0970087736' if dental else '0962359085' if women else '0989434806' if child else '0965892698'
  note=spec+'. '+('Детская поликлиника' if child else 'Стоматологическая поликлиника' if dental else 'Женская консультация' if women else 'Взрослая поликлиника, ул. Клушина, 6')+'. Уточните текущий приём через регистратуру.'
  if any(r['source']=='doctors' and r['name']==name and r['category']==cat for r in records):continue
  add(cat,name,phone,note=note,source='doctors',phoneLabel='Регистратура, не личный номер')
sources['mental']={'label':'Центр ПМСП · городской путеводитель, 02.09.2026','url':'https://izm.pmsd.org.ua/novyny/putivnyk-marshruty-posluh-z-mentalnoho-zdorov-ia-v-izmailskij-miskij-terytorialnij-hromadi/','checked':'2026-09-30','kind':'official'}
add('96283','Центр життєстійкості','0679558976,0675260747,0961085329',note='ул. Национальной гвардии Украины, 79. Психосоциальная поддержка; доступного специалиста уточните в центре.',source='mental',phoneLabel='Контакты центра')
add('96283','Городской центр социальных служб','0484172407',note='пр. Незалежності, 62. Помощь с обращением за поддержкой; не личный номер психолога.',source='mental',phoneLabel='Контакт учреждения')
# Merge duplicate institution listings; keep specialists sharing a registry distinct.
for cat,phone,src in [('96248','0970676991','eurotom'),('96230','0672984060','primary'),('96292','0962359085','hospital')]:
 records=[r for r in records if not (r['category']==cat and r['source']=='telegram' and r['phones']==[phone])]
for r in records:
 if r['category']=='96292' and r['source']=='hospital':r['note']='Регистратура. В подборке указан адрес: ул. Коммерческая, 111; уточните при записи.'
sources['smartlab']={'label':'Смартлаб · отделение в Измаиле','url':'https://smartlab.ua/address/izmayil/izmayil-vul-verhnotorgova-56-primishennya-3','checked':'2026-09-30','kind':'official'}
for cat,name in [('96304','Мойсеєнко Альона Леонідівна · эндокринолог'),('96264','Почтаренко Ігор В’ячеславович · кардиолог')]:
 add(cat,name,'0800750070,0733750070',note='Смартлаб, ул. Верхнеторговая, 56, помещение 3. Наличие приёма уточните при записи.',source='smartlab',phoneLabel='Контакт-центр, не личный номер')
from enrich import enrich
enrich(records,categories,sources)
for i,c in enumerate(categories):
 c['order']=i
 c['count']=sum(r['category']==c['id'] for r in records)
 c['note']='Дополнительные немедицинские практики; не замена медицинской помощи.' if c['id']=='96054' else ''
result={'cityOrder':['Измаил','Килия','Болград','Рени','Татарбунары','Одесса','Киев','Львов'],'updated':'2026-09-30','sources':sources,'categories':categories,'records':records}
(ROOT.parent/'data.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
# Audit every full telephone number in every supplied category.
missing=[]
for c in data:
 original=set(re.findall(r'(?<!\d)0\d{9}(?!\d)',c.get('text','').replace(' ','').replace('\xa0','')))
 transferred={p for r in records if r['category']==c['id'] for p in r['phones']}
 if original-transferred:missing.append((c['id'],list(original-transferred)))
assert not missing,missing
assert all(re.fullmatch(r'0\d{9}|1677',p) for r in records for p in r['phones'])
print('Categories:',len(categories),'Records:',len(records),'Unique phones:',len({p for r in records for p in r['phones']}),'Untransferred:',missing)
