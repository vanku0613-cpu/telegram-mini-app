# Фоны главного меню

Сезонные и световые варианты созданы встроенным imagegen, без CLI. Исходник пользователя сохранён как izmail-home.jpg и используется вечером весной/летом. Старые встроенные сезонные фотографии удалены из обеих главных страниц. Все варианты размещаются в прежнем блоке с пропорцией 941 / 1672. Кнопки не перемещаются.

Файлы в этой папке:
- izmail-home.jpg — исходная фотография / летний вечер.
- izmail-home-winter.webp — оптимизированный зимний вечер со снегом и включёнными фонарями.
- izmail-home-autumn.webp — оптимизированная поздняя осень, вечер.
- izmail-home-summer-day.webp, izmail-home-winter-day.webp, izmail-home-autumn-day.webp — оптимизированные дневные сцены, фонари выключены.
- izmail-home-summer-night.webp, izmail-home-winter-night.webp, izmail-home-autumn-night.webp — оптимизированные ночные сцены с включёнными фонарями, без закатного солнца.

Весна использует зелёный летний пейзаж. Снегопад выбирает заснеженный вариант независимо от месяца. Это декоративная визуализация: снег на земле и состояние растений не измеряются сервисом. Ночь, вечер и день выбираются по существующим настройкам часов Europe/Kyiv. Осадки, ветер, туман, гроза и град выбираются по тому же текущему ответу Open-Meteo, что и виджет погоды (интервал существующей настройки — 10 минут). Источник кодов: https://open-meteo.com/en/docs#weather_variable_documentation . Коды 96/99 включают град, 95/96/97/99 — грозу. Эффект молнии не является детектором реальных ударов.

Звёзды, облака, снег, дождь, град, листья и молния анимируются кодом. Смена фона ждёт загрузки изображения и не меняет размеры. Вспышки редкие и слабые; уменьшение движения отключает анимацию.

## Набор финальных запросов к imagegen

Первые сезонные правки: зимний пейзаж со снегом на дорожках, кустах, скамьях и ветвях; позднеосенний пейзаж с голыми лиственными деревьями и опавшей листвой. Сохранить все слова, композицию и крупный размытый низ исходника; без встроенных падающих частиц. Затем применены следующие точные запросы освещения к сезонным вариантам:

### summer / daylight

Use case: lighting-weather. Edit the supplied summer Izmail artwork precisely. This is the DAYLIGHT version. Make ALL street lamps completely switched OFF: glass panes dull transparent grey, no white/yellow luminous lamp cores, no amber bloom, no warm lamp pools on path or snow. These are black metal unlit lanterns in daytime. Preserve the neon lettering and logos brightly lit: they are the brand and must NOT be turned off. Keep every existing Cyrillic word, its exact shape, size and position, especially СПРАВОЧНИК ИЗМАИЛ and Всё для наших людей, всё под рукой. Preserve framing, 9:16 portrait proportions, architecture, season, trees, plants, path, river, benches and lower blurred foreground composition exactly. Neutral natural daytime sky, no conspicuous orange sunset or low sun disk; retain realistic daylight sky texture for animated clouds. No snow/rain particles baked into picture. Do not move, resize, add or remove objects except lamp light. Output one entire edited portrait artwork, no border, UI or collage.

### summer / night

Use case: lighting-weather. Turn this exact summer Izmail directory artwork into a realistic NIGHT version. Same 9:16 complete portrait, all objects, church, trees, season and all Cyrillic text and logo geometry absolutely unchanged. Preserve neon title and circular logo brightly glowing and fully readable, not dim. Change environmental lighting only: genuine deep blue night sky and cool low moonlight, absolutely NO sun disk, NO sunset orange sky or orange horizon. ALL street lanterns now switched ON with warm amber light visibly illuminating nearby path or snow; distant lamps lit too. Park still legible in soft cool shadows. Keep the lower blue blurred area for buttons. Do NOT bake in stars, falling precipitation, lightning, fog or moon disk: code animates these independently according to weather. Do not add words, move buildings, change vegetation or alter typography. Output one complete edited background, not a collage or UI screenshot.

### winter / daylight

Use case: lighting-weather. Edit the supplied winter Izmail artwork precisely. This is the DAYLIGHT version. Make ALL street lamps completely switched OFF: glass panes dull transparent grey, no white/yellow luminous lamp cores, no amber bloom, no warm lamp pools on path or snow. These are black metal unlit lanterns in daytime. Preserve the neon lettering and logos brightly lit: they are the brand and must NOT be turned off. Keep every existing Cyrillic word, its exact shape, size and position, especially СПРАВОЧНИК ИЗМАИЛ and Всё для наших людей, всё под рукой. Preserve framing, 9:16 portrait proportions, architecture, season, trees, plants, path, river, benches and lower blurred foreground composition exactly. Neutral natural daytime sky, no conspicuous orange sunset or low sun disk; retain realistic daylight sky texture for animated clouds. No snow/rain particles baked into picture. Do not move, resize, add or remove objects except lamp light. Output one entire edited portrait artwork, no border, UI or collage.

### winter / night

Use case: lighting-weather. Turn this exact winter Izmail directory artwork into a realistic NIGHT version. Same 9:16 complete portrait, all objects, church, trees, season and all Cyrillic text and logo geometry absolutely unchanged. Preserve neon title and circular logo brightly glowing and fully readable, not dim. Change environmental lighting only: genuine deep blue night sky and cool low moonlight, absolutely NO sun disk, NO sunset orange sky or orange horizon. ALL street lanterns now switched ON with warm amber light visibly illuminating nearby path or snow; distant lamps lit too. Park still legible in soft cool shadows. Keep the lower blue blurred area for buttons. Do NOT bake in stars, falling precipitation, lightning, fog or moon disk: code animates these independently according to weather. Do not add words, move buildings, change vegetation or alter typography. Output one complete edited background, not a collage or UI screenshot.

### autumn / daylight

Use case: lighting-weather. Edit the supplied autumn Izmail artwork precisely. This is the DAYLIGHT version. Make ALL street lamps completely switched OFF: glass panes dull transparent grey, no white/yellow luminous lamp cores, no amber bloom, no warm lamp pools on path or snow. These are black metal unlit lanterns in daytime. Preserve the neon lettering and logos brightly lit: they are the brand and must NOT be turned off. Keep every existing Cyrillic word, its exact shape, size and position, especially СПРАВОЧНИК ИЗМАИЛ and Всё для наших людей, всё под рукой. Preserve framing, 9:16 portrait proportions, architecture, season, trees, plants, path, river, benches and lower blurred foreground composition exactly. Neutral natural daytime sky, no conspicuous orange sunset or low sun disk; retain realistic daylight sky texture for animated clouds. No snow/rain particles baked into picture. Do not move, resize, add or remove objects except lamp light. Output one entire edited portrait artwork, no border, UI or collage.

### autumn / night

Use case: lighting-weather. Turn this exact autumn Izmail directory artwork into a realistic NIGHT version. Same 9:16 complete portrait, all objects, church, trees, season and all Cyrillic text and logo geometry absolutely unchanged. Preserve neon title and circular logo brightly glowing and fully readable, not dim. Change environmental lighting only: genuine deep blue night sky and cool low moonlight, absolutely NO sun disk, NO sunset orange sky or orange horizon. ALL street lanterns now switched ON with warm amber light visibly illuminating nearby path or snow; distant lamps lit too. Park still legible in soft cool shadows. Keep the lower blue blurred area for buttons. Do NOT bake in stars, falling precipitation, lightning, fog or moon disk: code animates these independently according to weather. Do not add words, move buildings, change vegetation or alter typography. Output one complete edited background, not a collage or UI screenshot.

