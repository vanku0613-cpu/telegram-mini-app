/* =========================================================
   СПРАВОЧНИК ИЗМАИЛ — SERVICE WORKER
   Ускорение main-v2
   ========================================================= */

const CACHE_NAME = "izmail-main-v2-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./settings.js"
];


/* =========================================================
   УСТАНОВКА
   Сохраняем основные файлы заранее
   ========================================================= */

self.addEventListener("install", function (event) {

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(APP_FILES);
      })
  );

  self.skipWaiting();

});


/* =========================================================
   АКТИВАЦИЯ
   Удаляем старые версии кэша
   ========================================================= */

self.addEventListener("activate", function (event) {

  event.waitUntil(

    caches
      .keys()
      .then(function (cacheNames) {

        return Promise.all(

          cacheNames.map(function (name) {

            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }

          })

        );

      })

  );

  self.clients.claim();

});


/* =========================================================
   ЗАПРОСЫ
   ========================================================= */

self.addEventListener("fetch", function (event) {

  const request = event.request;

  if (request.method !== "GET") {
    return;
  }


  const url = new URL(request.url);


  /* ---------------------------------------------------------
     Не вмешиваемся в сторонние сайты/API
     --------------------------------------------------------- */

  if (url.origin !== self.location.origin) {
    return;
  }


  /* ---------------------------------------------------------
     SETTINGS.JS

     У тебя settings.js может открываться с ?v=...
     Поэтому игнорируем параметр версии и используем один кэш.
     --------------------------------------------------------- */

  if (url.pathname.endsWith("/main-v2/settings.js")) {

    event.respondWith(

      caches
        .open(CACHE_NAME)
        .then(async function (cache) {

          const cacheKey =
            new Request(
              new URL("./settings.js", self.location).href
            );

          const cached =
            await cache.match(cacheKey);

          const networkPromise =
            fetch(request)
              .then(function (response) {

                if (response && response.ok) {
                  cache.put(
                    cacheKey,
                    response.clone()
                  );
                }

                return response;

              })
              .catch(function () {
                return cached;
              });


          /*
             Показываем сохранённый файл сразу,
             а свежую версию получаем в фоне.
          */

          return cached || networkPromise;

        })

    );

    return;

  }


  /* ---------------------------------------------------------
     ПЕРЕХОДЫ ПО СТРАНИЦАМ

     Сначала пробуем интернет.
     Если сеть медленная/пропала — берём сохранённую страницу.
     --------------------------------------------------------- */

  if (request.mode === "navigate") {

    event.respondWith(

      fetch(request)
        .then(function (response) {

          const copy =
            response.clone();

          caches
            .open(CACHE_NAME)
            .then(function (cache) {
              cache.put(request, copy);
            });

          return response;

        })
        .catch(function () {

          return caches
            .match(request)
            .then(function (cached) {

              if (cached) {
                return cached;
              }

              return caches.match("./index.html");

            });

        })

    );

    return;

  }


  /* ---------------------------------------------------------
     ОСТАЛЬНЫЕ ФАЙЛЫ

     Сначала кэш — поэтому изображения, CSS и JS
     повторно открываются намного быстрее.
     --------------------------------------------------------- */

  event.respondWith(

    caches
      .match(request)
      .then(function (cached) {

        if (cached) {
          return cached;
        }


        return fetch(request)
          .then(function (response) {

            if (
              !response ||
              !response.ok
            ) {
              return response;
            }


            const copy =
              response.clone();


            caches
              .open(CACHE_NAME)
              .then(function (cache) {
                cache.put(request, copy);
              });


            return response;

          });

      })

  );

});
