# Источники обложек

Две фотографии используются как иллюстрации направлений, не как портреты врачей из справочника. Заголовки нанесены интерфейсом HTML/CSS; они остаются чёткими на маленьких экранах.

- `doctor-photo.jpg`: Pavel Danilyuk, Pexels, https://www.pexels.com/photo/physician-in-white-coat-wearing-a-stethoscope-5998476/ . Лицензия Pexels: https://www.pexels.com/license/ .
- `beauty-photo.jpg`: Gustavo Fring, Pexels, https://www.pexels.com/photo/woman-getting-facial-treatment-3985323/ . Лицензия Pexels.
- `cover-*.jpg`: 62 иллюстративные обложки созданы встроенным image_gen 30.09.2026; оптимизированы до ширины 720px для приложения. Не изображают конкретные клиники/врачей. Все прежние видеообложки и их постеры заменены статичными изображениями.

Промпт для каждого изображения (значения TITLE и SCENE в `../research/generated-covers.json`):

Create ONE finished landscape directory cover approximately 3:2 aspect ratio, not collage of covers. Match Russian Izmail directory style: deep navy royal-blue photographic backdrop with tiny tasteful cyan bokeh, glossy beveled cyan blue rounded title panels. Top small but legible exact Russian heading "СПРАВОЧНИК ИЗМАИЛ". Below large crisp white exact category text "TITLE", fitting fully with margins. Lower half a tasteful realistic stock-style photograph depicting SCENE, integrated into softly rounded rectangular frame. Generic illustrative scene only, no real named doctor identity, no clinic brand. Polished readable composition at 320px width, no extra slogans or logos. Blue harmonious palette. Use case ads-marketing.


53 новые статичные обложки: `cover-<id>.jpg`. Точный промпт и исходные файлы для каждой категории сохранены в `../research/static-covers-20260930.json` (поле promptTemplate, TITLE = name в верхнем регистре). Изображения иллюстративные, не портреты специалистов из карточек.
