# Notes from the current request

## Зафиксированные технические настройки

- Рабочая главная страница находится в `main-v2/index.html`; её активные настройки — в `main-v2/settings.js`. Корневой `settings.js` и `main-v2/sw.js` сохранены только для совместимости со старыми установленными версиями и не должны становиться вторым источником текущих настроек.
- Общий service worker — корневой `sw.js`. Он обслуживает всё приложение, удаляет старые версии собственного кэша и использует сетевую загрузку с быстрым переходом на сохранённую копию. В начальный аварийный набор входит один базовый фон; остальные сезонные изображения и большие справочники сохраняются по мере использования.
- Глобальный поиск загружает большие справочники только при первом открытии или вводе. Не переносить эти данные в главный HTML и не загружать их заранее.
- Публикация содержит только файлы приложения. Тесты, генераторы, исследовательские материалы и рабочие заметки остаются в репозитории, но не отправляются в GitHub Pages.
- Большие встроенные HTML/CSS/JS-фрагменты не разделять только ради размера файла: для статического приложения дополнительный запрос может замедлить открытие. Разделять код следует по самостоятельным функциям и только вместе с проверкой загрузки и кэша.
- Перед удалением изображения необходимо подтвердить, что на него нет статической или программно формируемой ссылки. Активные WebP-обложки, фотографии сёл и данные расписаний удалять нельзя.

## Единые правила интерфейса

- Keep the Health and Care cards still when tapped or held.
- Main search and section search: pressing Enter or the search button closes the mobile keyboard. The magnifying glass opens search; pressing it again closes the search panel. Clearing a query also closes the keyboard.
- Education and Development has Education and Training, Tutors (with its six subject folders), Sport and Children's Clubs, and Kindergartens.
- Keep the shared blue/cyan visual style and put “Справочник Измаил” on the Beauty and Care, doctor, care, and education covers.
- Shelter title and its short address/phone hint fit on one line; remove the “Where the information comes from” panel.
- Every inner “Вернуться в главное меню” control uses the same 340 px maximum width, 50 px minimum height, spacing, radius, and readable responsive text as the Services and Masters directory.
- Contact phone rows use one shared pattern: the phone number stays on the left and “Позвонить” stays on the right, including every Education and Development folder.
- Contact cards keep a content-driven height and must not contain large empty vertical areas; their width may adapt to the available grid and screen.
- Education and Development keeps one fixed profile cover throughout its nested folders; only the section title and content change, with no old category-specific photos in the header.
