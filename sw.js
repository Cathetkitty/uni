
const CACHE_NAME = "unimart-offline-v1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./login.html",
    "./dashboard.html",
    "./style.css",
    "./script.js"
];

// INSTALL SERVICE WORKER
self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)

            .then(cache => {
                return cache.addAll(FILES_TO_CACHE);
            })

            .then(() => self.skipWaiting())

    );

});

// ACTIVATE SERVICE WORKER
self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys.map(key => {

                    if (
                        key.startsWith("unimart-") &&
                        key !== CACHE_NAME
                    ) {
                        return caches.delete(key);
                    }

                })

            );

        }).then(() => self.clients.claim())

    );

});

// FETCH CACHED FILES
self.addEventListener("fetch", event => {

    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    // Handle other websites separately
    if (url.origin !== self.location.origin) {

        event.respondWith(

            caches.match(request).then(cached => {

                return cached ||
                    fetch(request).catch(() => Response.error());

            })

        );

        return;
    }

    // Handle HTML navigation
    if (request.mode === "navigate") {

        event.respondWith(

            fetch(request)

                .then(response => {

                    if (response.ok) {

                        const copy = response.clone();

                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, copy);
                        });

                    }

                    return response;

                })

                .catch(async () => {

                    return (
                        await caches.match(request) ||
                        await caches.match("./index.html") ||
                        Response.error()
                    );

                })

        );

        return;
    }

    // Handle CSS, JavaScript, images and other assets
    event.respondWith(

        caches.match(request).then(cached => {

            if (cached) {
                return cached;
            }

            return fetch(request)

                .then(response => {

                    if (
                        response.ok ||
                        response.type === "opaque"
                    ) {

                        const copy = response.clone();

                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, copy);
                        });

                    }

                    return response;

                })

                .catch(() => Response.error());

        })

    );

});
