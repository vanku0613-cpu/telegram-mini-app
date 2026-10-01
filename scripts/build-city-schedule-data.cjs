const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'transport', 'city-schedule');
const updated = '01.10.2026';
const places = {
  izmail:[45.3507,28.8378], kiliya:[45.4552,29.2637], vilkove:[45.4021,29.5860], reni:[45.4566,28.2795],
  bolgrad:[45.6819,28.6143], artsyz:[45.9910,29.4182], tatarbunary:[45.8372,29.6142], bilhorod:[46.1855,30.3415],
  odesa:[46.4825,30.7233], kyiv:[50.4501,30.5234], chisinau:[47.0105,28.8638], cahul:[45.9043,28.1993],
  sofia:[42.6977,23.3219], prague:[50.0755,14.4378], kherson:[46.6354,32.6169]
};

const stop=(name,coords)=>({name,lat:coords[0],lng:coords[1]});
const line=(id,origin,destination,departures,options={})=>{
  const a=options.a||places[options.originKey]||places[origin.toLowerCase()]||places.izmail;
  const b=options.b||places[options.destinationKey]||places[destination.toLowerCase()]||places.odesa;
  return {id,name:`${origin} — ${destination}`,days:options.days||'По расписанию',directions:[{
    label:`Из ${origin}`,name:`${origin} → ${destination}`,hours:'',interval:'',departures,
    extra:options.extra||'',stops:[stop(origin,a),stop(destination,b)],shape:[a,b]
  }]};
};
const group=(id,title,icon,routes)=>({id,title,icon,fare:'',routes});
const city=(title,subtitle,groups)=>({title,subtitle,groups});

const cities={
  kiliya:city('Расписание Килии','Междугородние автобусы и маршрутки',[
    group('routes','Направления из Килии','🚌',[
      line('Одесса','Килия','Одесса',['04:20','05:00','08:10','09:10','10:45','11:15','12:35','14:15','15:00','16:00'],{originKey:'kiliya'}),
      line('Вилково','Килия','Вилково',['05:00','07:20','10:25','12:00','13:00'],{originKey:'kiliya',destinationKey:'vilkove'}),
      line('Измаил','Килия','Измаил',['06:30','08:50','12:30','15:00'],{originKey:'kiliya',destinationKey:'izmail'}),
      line('Кишинёв','Килия','Кишинёв',['09:00'],{originKey:'kiliya',destinationKey:'chisinau'}),
      line('Киев','Килия','Киев',['17:10'],{originKey:'kiliya',destinationKey:'kyiv'}),
      line('Новосёловка','Килия','Новосёловка',['12:00'],{originKey:'kiliya',b:[45.503,29.218]})
    ])
  ]),
  vilkove:city('Расписание Вилково','Автобусы из Вилково',[
    group('routes','Направления из Вилково','🚌',[
      line('Одесса','Вилково','Одесса',['03:50','04:30','06:00','10:00','11:50','13:20'],{originKey:'vilkove'}),
      line('Измаил','Вилково','Измаил',['05:30','08:00'],{originKey:'vilkove',destinationKey:'izmail',extra:'Рейсы следуют через Спасское или Килию.'}),
      line('Белгород-Днестровский','Вилково','Белгород-Днестровский',['06:30'],{originKey:'vilkove',destinationKey:'bilhorod'}),
      line('Киев','Вилково','Киев',['17:00'],{originKey:'vilkove',destinationKey:'kyiv',extra:'Проходящий рейс Килия — Киев.'})
    ])
  ]),
  reni:city('Расписание Рени','Автобусы из Рени',[
    group('routes','Направления из Рени','🚌',[
      line('Измаил','Рени','Измаил',['06:15','10:40','15:20'],{originKey:'reni',destinationKey:'izmail'}),
      line('Болград','Рени','Болград',['09:30'],{originKey:'reni',destinationKey:'bolgrad'}),
      line('Одесса','Рени','Одесса',['09:30'],{originKey:'reni'}),
      line('Котловина','Рени','Котловина',['09:30'],{originKey:'reni',b:[45.493,28.323]}),
      line('Сарата','Рени','Сарата',['09:30'],{originKey:'reni',b:[46.019,29.665]})
    ])
  ]),
  bolgrad:city('Расписание Болграда','Автобусы из Болграда',[
    group('routes','Основные направления','🚌',[
      line('Одесса','Болград','Одесса',['00:35','07:40','10:00','11:00','13:00','13:55','15:00','16:30'],{originKey:'bolgrad'}),
      line('Измаил','Болград','Измаил',['06:30','09:00','11:00','13:00','15:00','17:00'],{originKey:'bolgrad',destinationKey:'izmail'}),
      line('Рени','Болград','Рени',['14:30'],{originKey:'bolgrad',destinationKey:'reni'}),
      line('Белгород-Днестровский','Болград','Белгород-Днестровский',['14:00'],{originKey:'bolgrad',destinationKey:'bilhorod'}),
      line('Кагул','Болград','Кагул',['08:40','13:10'],{originKey:'bolgrad',destinationKey:'cahul'})
    ]),
    group('local','Ближайшие сёла','🚐',[
      line('Виноградовка','Болград','Виноградовка',['06:30','07:30','09:00','11:00','12:30','17:25'],{originKey:'bolgrad',b:[45.806,28.567]}),
      line('Калчева','Болград','Калчева',['12:55','17:30'],{originKey:'bolgrad',b:[45.737,28.811]}),
      line('Александровка','Болград','Александровка',['13:25'],{originKey:'bolgrad',b:[45.677,28.765]})
    ])
  ]),
  artsyz:city('Расписание Арциза','Автобусы из Арциза',[
    group('routes','Направления из Арциза','🚌',[
      line('Одесса','Арциз','Одесса',['05:30','06:04','08:15','08:45','09:00','09:15','18:45'],{originKey:'artsyz'}),
      line('Измаил','Арциз','Измаил',['05:10'],{originKey:'artsyz',destinationKey:'izmail'}),
      line('Татарбунары','Арциз','Татарбунары',['10:10','13:30'],{originKey:'artsyz',destinationKey:'tatarbunary'}),
      line('Белгород-Днестровский','Арциз','Белгород-Днестровский',['11:30'],{originKey:'artsyz',destinationKey:'bilhorod'}),
      line('Черноморск','Арциз','Черноморск',['05:10','12:50'],{originKey:'artsyz',b:[46.302,30.656]})
    ])
  ]),
  tatarbunary:city('Расписание Татарбунар','Междугородние автобусы',[
    group('routes','Направления из Татарбунар','🚌',[
      line('Измаил','Татарбунары','Измаил',['04:15'],{originKey:'tatarbunary',destinationKey:'izmail',days:'Вторник, четверг, суббота'}),
      line('Киев','Татарбунары','Киев',['19:20','20:10'],{originKey:'tatarbunary',destinationKey:'kyiv',days:'По отдельным дням недели'}),
      line('Прага','Татарбунары','Прага',['06:40'],{originKey:'tatarbunary',destinationKey:'prague',days:'Пятница'}),
      line('София','Татарбунары','София',['12:10'],{originKey:'tatarbunary',destinationKey:'sofia',days:'Среда и воскресенье'})
    ])
  ]),
  bilhorod:city('Расписание Белгорода-Днестровского','Автобусы от автовокзала',[
    group('regional','Города и район','🚌',[
      line('Киев','Белгород-Днестровский','Киев',['06:00'],{originKey:'bilhorod',destinationKey:'kyiv'}),
      line('Херсон','Белгород-Днестровский','Херсон',['07:25'],{originKey:'bilhorod',destinationKey:'kherson'}),
      line('Болград','Белгород-Днестровский','Болград',['07:50'],{originKey:'bilhorod',destinationKey:'bolgrad'}),
      line('Арциз','Белгород-Днестровский','Арциз',['09:50','14:00'],{originKey:'bilhorod',destinationKey:'artsyz'}),
      line('Измаил','Белгород-Днестровский','Измаил',['10:00','14:00'],{originKey:'bilhorod',destinationKey:'izmail'}),
      line('Вилково','Белгород-Днестровский','Вилково',['14:40'],{originKey:'bilhorod',destinationKey:'vilkove'}),
      line('Сарата','Белгород-Днестровский','Сарата',['13:30'],{originKey:'bilhorod',b:[46.019,29.665]}),
      line('Бендеры','Белгород-Днестровский','Бендеры',['14:25'],{originKey:'bilhorod',b:[46.83,29.47]})
    ]),
    group('villages','Сёла и курорты','🚐',[
      line('Дивизия','Белгород-Днестровский','Дивизия',['10:30','12:30','17:30'],{originKey:'bilhorod',b:[45.797,29.936]}),
      line('Весёлый Кут','Белгород-Днестровский','Весёлый Кут',['11:30','15:15'],{originKey:'bilhorod',b:[45.90,29.47]}),
      line('Тузлы','Белгород-Днестровский','Тузлы',['14:00'],{originKey:'bilhorod',b:[45.866,30.097]})
    ])
  ]),
  villages:city('Сёла Измаильского района','Маршруты из Измаила · выберите направление',[
    group('near','Ближайшие к Измаилу','🚐',[
      line('Сафьяны','Измаил','Сафьяны',['06:30','07:00','07:30','08:00','08:30','09:30','10:30','12:00','13:00','13:50','14:30','15:00','16:15','17:15','18:00','20:15'],{destinationKey:'izmail',b:[45.402,28.876]}),
      line('Матроска','Измаил','Матроска',['07:20','10:10','12:10','14:20','15:40','17:05'],{b:[45.343,28.789]}),
      line('Ларжанка','Измаил','Ларжанка',['06:05','07:30','14:00'],{b:[45.306,28.747]}),
      line('Броска','Измаил','Броска',['07:30','08:30','09:30','11:30','12:30','13:30','14:30','15:30','16:30','17:30'],{b:[45.376,28.896]}),
      line('Лощиновка','Измаил','Лощиновка',['06:30','06:40','12:00','17:00'],{b:[45.356,28.994]})
    ]),
    group('nekrasovka','Некрасовское направление','🚐',[
      line('Новая Некрасовка','Измаил','Новая Некрасовка',['06:00','06:20','08:00','09:00','10:20','11:00','12:20','13:00','14:00','15:00','16:15','17:10','18:10','20:10'],{b:[45.365,29.035]}),
      line('Старая Некрасовка','Измаил','Старая Некрасовка',['06:45','07:20','07:35','08:00','08:20','08:30','09:15','09:50','10:15','10:45','11:20','11:45','12:20','12:50','13:20','13:45','14:20','14:45','15:20','15:45','16:15','16:45','17:15','17:45','18:15','20:00'],{b:[45.423,29.057]}),
      line('Кислица','Измаил','Кислица',['07:00','09:50','12:10','14:10'],{b:[45.362,29.118]}),
      line('Муравлёвка','Измаил','Муравлёвка',['10:00','13:00','15:00','17:00'],{b:[45.394,29.254]})
    ]),
    group('lakes','Озёрное направление','🚐',[
      line('Озёрное','Измаил','Озёрное',['07:10','09:00','11:00','12:30','13:00','14:00','15:20','17:15','18:10','19:30'],{b:[45.404,28.682]}),
      line('Богатое','Измаил','Богатое',['07:05','08:10','09:30','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:20','20:30'],{b:[45.433,28.77]}),
      line('Утконосовка','Измаил','Утконосовка',['07:45','09:40','11:40','13:00','15:00','18:00'],{b:[45.497,28.953]}),
      line('Криничное','Измаил','Криничное',['10:45','14:00'],{b:[45.558,28.665]})
    ]),
    group('other','Другие сёла района','🚐',[
      line('Дунайское','Измаил','Дунайское',['06:35','07:45','08:40','11:00','12:35','14:00','15:00','16:10','17:30'],{b:[45.565,28.858]}),
      line('Первомайское','Измаил','Первомайское',['07:15','10:50','14:50','17:30'],{b:[45.568,29.13]}),
      line('Новокаланчак','Измаил','Новокаланчак',['07:30','10:20','13:00','15:20','18:00'],{b:[45.48,29.16]}),
      line('Камышовка','Измаил','Камышовка',['15:00'],{b:[45.59,28.92]}),
      line('Новосёловка','Измаил','Новосёловка',['15:15'],{b:[45.503,29.218]}),
      line('Дмитровка','Измаил','Дмитровка',['07:30','15:10'],{b:[45.64,29.17]})
    ])
  ])
};

function parseCsv(text){
  const rows=[];let row=[],cell='',quote=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quote&&text[i+1]==='"'){cell+='"';i++}else quote=!quote}else if(c===','&&!quote){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quote){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell=''}else cell+=c}
  if(cell||row.length){row.push(cell);rows.push(row)}
  const head=rows.shift();return rows.map(values=>Object.fromEntries(head.map((key,index)=>[key,values[index]||''])));
}
function readCsv(dir,file){return parseCsv(fs.readFileSync(path.join(dir,file),'utf8').replace(/^\uFEFF/,''))}
function simplify(points,limit=90){if(points.length<=limit)return points;const step=(points.length-1)/(limit-1);return Array.from({length:limit},(_,i)=>points[Math.round(i*step)])}
function buildKyiv(){
  const dir=path.join(os.tmpdir(),'kyiv-gtfs');if(!fs.existsSync(dir))return null;
  const routes=readCsv(dir,'routes.txt').filter(r=>['0','3','11'].includes(r.route_type));
  const routeIds=new Set(routes.map(r=>r.route_id));
  const trips=readCsv(dir,'trips.txt').filter(t=>routeIds.has(t.route_id));
  const tripMap=new Map(trips.map(t=>[t.trip_id,t]));
  const timesByTrip=new Map();for(const s of readCsv(dir,'stop_times.txt')){if(!tripMap.has(s.trip_id))continue;(timesByTrip.get(s.trip_id)||timesByTrip.set(s.trip_id,[]).get(s.trip_id)).push(s)}
  const stops=new Map(readCsv(dir,'stops.txt').map(s=>[s.stop_id,s]));
  const shapesById=new Map();for(const p of readCsv(dir,'shapes.txt')){if(!shapesById.has(p.shape_id))shapesById.set(p.shape_id,[]);shapesById.get(p.shape_id).push(p)}
  for(const points of shapesById.values())points.sort((a,b)=>Number(a.shape_pt_sequence)-Number(b.shape_pt_sequence));
  const tripsByRoute=new Map();for(const t of trips){if(!tripsByRoute.has(t.route_id))tripsByRoute.set(t.route_id,[]);tripsByRoute.get(t.route_id).push(t)}
  const typeMeta={0:['tram','Трамваи','🚋'],11:['trolleybus','Троллейбусы','🚎'],3:['bus','Автобусы','🚌']};
  const groups=[];
  for(const type of ['3','11','0']){
    const meta=typeMeta[type];const output=[];
    for(const route of routes.filter(r=>r.route_type===type)){
      const routeTrips=tripsByRoute.get(route.route_id)||[];const directions=[];
      for(const directionId of ['0','1']){
        const candidates=routeTrips.filter(t=>(t.direction_id||'0')===directionId&&timesByTrip.has(t.trip_id));if(!candidates.length)continue;
        const sample=candidates.reduce((best,t)=>(timesByTrip.get(t.trip_id).length>timesByTrip.get(best.trip_id).length?t:best),candidates[0]);
        const sampleTimes=timesByTrip.get(sample.trip_id).sort((a,b)=>Number(a.stop_sequence)-Number(b.stop_sequence));
        const stopList=sampleTimes.map(s=>stops.get(s.stop_id)).filter(Boolean).map(s=>({name:s.stop_name,lat:Number(s.stop_lat),lng:Number(s.stop_lon)}));
        const departures=[...new Set(candidates.map(t=>(timesByTrip.get(t.trip_id)||[]).sort((a,b)=>Number(a.stop_sequence)-Number(b.stop_sequence))[0]?.departure_time?.slice(0,5)).filter(Boolean))].sort();
        const shape=simplify((shapesById.get(sample.shape_id)||[]).map(p=>[Number(p.shape_pt_lat),Number(p.shape_pt_lon)]));
        directions.push({label:directionId==='0'?'Туда':'Обратно',name:stopList.length?`${stopList[0].name} → ${stopList.at(-1).name}`:route.route_long_name,hours:departures.length?`${departures[0]}–${departures.at(-1)}`:'',interval:'',departures,extra:'',stops:stopList,shape:shape.length?shape:stopList.map(s=>[s.lat,s.lng])});
      }
      if(directions.length)output.push({id:route.route_short_name,name:route.route_long_name||`Маршрут ${route.route_short_name}`,days:'Ежедневное городское расписание',directions});
    }
    output.sort((a,b)=>a.id.localeCompare(b.id,'ru',{numeric:true}));groups.push({id:meta[0],title:meta[1],icon:meta[2],fare:'30 грн',routes:output});
  }
  return city('Расписание Киева','Автобусы · троллейбусы · трамваи · остановки · карты',groups);
}

const kyiv=buildKyiv();
if(kyiv)cities.kyiv=kyiv;
else cities.kyiv=city('Расписание Киева','Данные городского транспорта временно обновляются',[]);
const dataDir=path.join(outDir,'data');
fs.mkdirSync(dataDir,{recursive:true});
for(const [id,value] of Object.entries(cities))fs.writeFileSync(path.join(dataDir,`${id}.json`),JSON.stringify({updated,...value}));
console.log(`Wrote ${Object.keys(cities).length} schedules; Kyiv routes: ${cities.kyiv.groups.reduce((sum,g)=>sum+g.routes.length,0)}`);
