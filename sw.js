
const CACHE_NAME = "unimart-github-v1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./login.html",
    "./dashboard.html",
    "./style.css",
    "./script.js",

    // Add your actual image paths here
    "./images/logo.png",
    "./images/product1.png",
    "./images/product2.png"
];

// INSTALL
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            for (const file of FILES_TO_CACHE) {
                try {
                    await cache.add(file);
                    console.log("Saved offline:", file);
                } catch (error) {
                    console.warn("Could not cache:", file);
                }
            }
        }).then(() => self.skipWaiting())
    );
});

// ACTIVATE
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key =>
                        key.startsWith("unimart-") &&
                        key !== CACHE_NAME
                    )
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// FETCH
self.addEventListener("fetch", event => {
    const request = event.request;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    // Only handle requests from this website
    if (url.origin !== self.location.origin) return;

    // Pages: load cached page first
    if (request.mode === "navigate") {
        event.respondWith(
            caches.match(request).then(async cached => {
                if (cached) return cached;

                try {
                    const response = await fetch(request);

                    if (response.ok) {
                        const copy = response.clone();
                        const cache = await caches.open(CACHE_NAME);
                        await cache.put(request, copy);
                    }

                    return response;
                } catch (error) {
                    return (
                        await caches.match("./index.html") ||
                        Response.error()
                    );
                }
            })
        );

        return;
    }

    // CSS, JavaScript, images and other files
    event.respondWith(
        caches.match(request).then(async cached => {
            if (cached) return cached;

            try {
                const response = await fetch(request);

                if (response.ok) {
                    const copy = response.clone();
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(request, copy);
                }

                return response;
            } catch (error) {
                return Response.error();
            }
        })
    );
});
