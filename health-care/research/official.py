from collect import *
from urllib.parse import quote
urls={
 'hospital-contacts':'https://izmailcml.org.ua/контакты/',
 'hospital-doctors':'https://izmailcml.org.ua/безкоштовні-послуги/',
 'primary':'https://izm.pmsd.org.ua/kontaktna-informatsiya/',
 'lileya':'https://lileyamed.com.ua/contact/',
 'ukrmedtrans':'https://ukrmedtrans.com/contacts',
 'eurotom':'https://www.eurotom.in/'}
def get(item):
 name,url=item
 try:
  raw=fetch(quote(url,safe=':/?=&%')).decode();tree=P(raw).root
  (ROOT/(name+'.html')).write_text(raw,encoding='utf-8')
  rows=[' | '.join(n.text().split()) for n in tree.find(lambda n:n.tag=='tr')]
  (ROOT/(name+'.txt')).write_text('\n'.join(rows) if rows else re.sub(r'\n\s*\n','\n',tree.text()),encoding='utf-8')
  return name,len(raw)
 except Exception as e:return name,str(e)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:print(list(pool.map(get,urls.items())))
