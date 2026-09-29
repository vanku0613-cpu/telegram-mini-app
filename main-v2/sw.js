/* =========================================================
   СПРАВОЧНИК ИЗМАИЛ — SERVICE WORKER
   Ускорение main-v2
   ========================================================= */

const CACHE_NAME = "izmail-main-v2-frank-v3";

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
        return cache.addAll(APP_FILES.map(function (url) {
          return new Request(url, { cache: "no-store" });
        }));
      })
  );

  self.skipWaiting();

});


/* =========================================================
   АКТИВАЦИЯ
   Удаляем старые версии кэша
   ========================================================= */

self.addEventListener("activate", function (event) {
  event.waitUntil((async function () {
    const names = await caches.keys();
    const obsolete = names.filter(function (name) {
      return name.startsWith("izmail-main-v2-") && name !== CACHE_NAME;
    });
    await Promise.all(obsolete.map(function (name) { return caches.delete(name); }));
    await self.clients.claim();
    // Old HTML has no update listener. Replace it once after this migration,
    // so users do not have to press Telegram's refresh button themselves.
    if (obsolete.length) {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      windows.forEach(function (client) {
        if (!client.url.startsWith(self.registration.scope)) return;
        const url = new URL(client.url);
        if (url.searchParams.get("frank_revision") === "3") return;
        url.searchParams.set("frank_revision", "3");
        // Do not await navigation inside activation: its fetch waits for the
        // activation event to finish, which would otherwise deadlock.
        client.navigate(url.href).catch(function () {});
      });
    }
  })());
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

  /* Rates bypass the general cache-first rule; the UI retains validated data. */
  if (url.pathname.endsWith("/data/frank-rates.json")) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  if (url.pathname.endsWith("/main-v2/frank-rates.js")) {
    event.respondWith((async function () {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request, { cache: "no-store" });
        if (!response.ok) throw new Error("rates-script-http");
        await cache.put(request, response.clone());
        return response;
      } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw error;
      }
    })());
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
            fetch(request, { cache: "no-store" })
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


          return networkPromise;

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

      fetch(request, { cache: "no-store" })
        .then(function (response) {
          if (!response.ok) throw new Error("page-http-" + response.status);

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
