(function (root) {
  'use strict';
  const aliases = {
    'Ізмаїл':'Измаил','Одеса':'Одесса','Київ':'Киев','Рені':'Рени','Кілія':'Килия',
    'Вилкове':'Вилково','Арциз':'Арциз','Татарбунари':'Татарбунары',
    'Білгород-Дністровський':'Белгород-Днестровский','Біла Церква':'Белая Церковь',
    'Вінниця':'Винница','Дніпро':'Днепр','Харків':'Харьков','Миколаїв':'Николаев',
    'Запоріжжя':'Запорожье','Кривий Ріг':'Кривой Рог','Криве Озеро':'Кривое Озеро',
    'Кишинів':'Кишинёв','Кишинев':'Кишинёв','Сонячний берег':'Солнечный Берег',
    'Бреїла':'Брэила','Галац':'Галац','Пловдів':'Пловдив','Софія':'София',
    'Познань':'Познань','Вільнюс':'Вильнюс','Велико-Тирново':'Велико-Тырново',
    'Суми':'Сумы','Словянськ':'Славянск','Слов’янськ':'Славянск','Анталія':'Анталья'
  };
  const foreign = new Set(['Кишинёв','Кагул','Бендеры','Бухарест','Брэила','Галац','Констанца','Варна','Бургас','Пловдив','София','Русе','Велико-Тырново','Солнечный Берег','Прага','Познань','Варшава','Вроцлав','Вильнюс','Стамбул','Анталья']);
  const local = new Set(['Измаил','Одесса','Рени','Килия','Вилково','Болград','Арциз','Татарбунары','Белгород-Днестровский','Сарата','Черноморск']);
  const canonical = value => aliases[String(value || '').trim()] || String(value || '').trim();
  const today = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Kyiv'}).format(new Date());
  const dateLabel = date => /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.split('-').reverse().join('.') : date;
  function category(route, villages = []) {
    if (route.places.some(p => foreign.has(p))) return 'international';
    if (route.places.every(p => local.has(p) || villages.includes(p))) return 'nearby';
    return 'ukraine';
  }
  function usableTrips(direction, day = today()) {
    return (direction.trips || []).filter(t => t.date >= day);
  }
  function status(direction, day = today()) {
    if (usableTrips(direction, day).length) return 'dated';
    return direction.trips?.length ? 'expired' : 'unconfirmed';
  }
  const api = {canonical, category, today, dateLabel, usableTrips, status};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ScheduleModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
