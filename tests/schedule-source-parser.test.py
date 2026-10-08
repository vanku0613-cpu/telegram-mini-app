import importlib.util
import pathlib
import unittest
import json

path = pathlib.Path(__file__).resolve().parents[1] / 'scripts/collect-schedule-sources.py'
spec = importlib.util.spec_from_file_location('collector', path)
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)

def load_script(filename):
    definition=importlib.util.spec_from_file_location(filename,path.parent/filename)
    module=importlib.util.module_from_spec(definition)
    definition.loader.exec_module(module)
    return module

city=load_script('import-izmail-city-schedule.py')
kyiv=load_script('import-kyiv-schedule.py')
odesa=load_script('audit-odesa-city-schedule.py')


class ScheduleSources(unittest.TestCase):
    def test_city_import_skips_banner_and_uses_departure_not_arrival(self):
        markup='''<p>Міський автобусний маршрут № 7 (Робочі дні)</p><table>
        <tr><td></td><td></td></tr><tr><td>Новий цвинтар</td><td>Центр прибуття -відправлення</td></tr>
        <tr><td>06:30</td><td>06:54-06:58</td></tr></table>'''
        schedule=city.extract(markup)['7'][0]
        self.assertEqual(schedule['rows'][0],['Новий цвинтар','Центр · отправление'])
        self.assertEqual(schedule['rows'][1],['06:30','06:58'])

    def test_city_benefit_stops_are_not_merged_into_banner(self):
        markup='''<p>МІСЬКИЙ АВТОБУСНИЙ МАРШРУТ № 12 У ЗВИЧАЙНОМУ РЕЖИМІ</p><table>
        <tr><td colspan="2">ВІДПРАВЛЕННЯ З:</td></tr><tr><td>ВУЛ. ЧОРНОВОЛА</td><td>ЦЕНТР</td></tr>
        <tr><td>8:00</td><td>8:30</td></tr></table>'''
        schedule=city.extract(markup)['12'][0]
        self.assertEqual(schedule['rows'][1],['08:00','08:30'])
        self.assertEqual(len(schedule['rows'][0]),2)

    def test_gtfs_respects_weekends_and_exception_dates(self):
        import datetime
        service={'service_id':'a','start_date':'20260101','end_date':'20261231',**dict.fromkeys(['monday','tuesday','wednesday','thursday','friday'],'1'), 'saturday':'0','sunday':'0'}
        self.assertTrue(kyiv.active(service,datetime.date(2026,10,9),{}))
        self.assertFalse(kyiv.active(service,datetime.date(2026,10,10),{}))
        self.assertTrue(kyiv.active(service,datetime.date(2026,10,10),{('a','20261010'):'1'}))
        self.assertFalse(kyiv.active(service,datetime.date(2026,10,9),{('a','20261009'):'2'}))

    def test_odesa_handles_dot_times_and_split_inline_formatting(self):
        markup='''<table><tr><td>Маршрут</td><td>2</td>
        <td><p>А – 6.00</p><p>Б – 6.30</p></td>
        <td><p>А – <strong>21</strong><strong>:30</strong></p><p>Б – 22.01</p></td><td>20-21</td></tr></table>'''
        table=odesa.extract(markup)
        self.assertEqual(table['terminals'][0],{'terminal':'А','first':'06:00','last':'21:30'})

    def test_jsonld_preserves_service_date_and_boarding_station(self):
        trip = {'@type':'BusTrip','departureTime':'2026-10-09T06:20:00+03:00',
                'departureBusStop':{'name':'АС Привокзальная','address':{'addressLocality':'Одеса','streetAddress':'Старосенная, 1Б'}},
                'arrivalBusStop':{'address':{'addressLocality':'Київ'}},'provider':{'name':'LikeBus'}}
        markup = '<script type="application/ld+json">' + json.dumps({'@graph':[trip,trip]}) + '</script>'
        rows = collector.parse_trips(markup)
        self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]['from'],'Одеса')
        self.assertEqual(rows[0]['departure'],'2026-10-09T06:20:00+03:00')
        self.assertEqual(rows[0]['fromAddress'],'Старосенная, 1Б')
        self.assertEqual(collector.parse_trips('<p>Щодня 00:00</p>'),[])

    def test_station_does_not_turn_an_incoming_route_into_a_departure(self):
        row = '<tr><td><a href="/ua/route/?for_city=1&amp;from={}&amp;to=Київ&amp;date=09.10.2026">Рейс</a></td><td>{}</td></tr>'
        clock = ''.join('<div class="numb oswald">'+d+'</div>' for d in '0830')
        trips = collector.parse_station(row.format('Одеса',clock)+row.format('Миколаїв',clock))
        self.assertEqual(len(trips),1)
        self.assertEqual(trips[0]['departure'],'2026-10-09T08:30:00')

    def test_booking_parser_uses_boarding_time_not_through_service_origin_time(self):
        html = '''<tr class="trip"><td><span class="date_dep">09.10.26</span></td><td>09.10.26</td>
        <td title="Старосенная, 1Б; Телефон: 123"><small>ОДЕСА:Автостанція</small><b>05:15</b></td>
        <td>10:00<small>КІЛІЯ</small></td><td>500</td><td>309</td><td>99%</td>
        <td><small>Київ - Кілія (23:15)</small><small>Автолайн</small></td></tr>'''
        url = 'https://ticket.bus.com.ua/order/forming_bn?point_from=UA5110100000&point_to=UA5122310100'
        row = collector.parse_bus(html,url)[0]
        self.assertEqual(row['departure'],'2026-10-09T05:15:00')
        self.assertEqual(row['from'],'Одесса')
        self.assertEqual(row['to'],'Килия')
        self.assertEqual(row['fromAddress'],'Старосенная, 1Б')


if __name__ == '__main__':
    unittest.main()
