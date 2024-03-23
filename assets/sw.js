import * as params from '@params';

class Pwa {

    constructor(self) {
        this.scope = self;
        this.CACHE_VERSION = params.version;
        this.BASE_CACHE_FILES = params.resources;
        this.host = `${self.location.protocol}//${self.location.host}`;
        this.OFFLINE_PAGE = '/offline';
        this.NOT_FOUND_PAGE = '/404.html';
        this.CACHE_NAME = `content-v${this.CACHE_VERSION}`;
        this.MAX_TTL = 86400;
        this.TTL_EXCEPTIONS = ["jpg", "webp", "svg", "jpeg", "png", "gif"];
    }

    canCache(url) {
        if (url.startsWith("http://localhost")) {
            return false;
        }
        const result = url.toString();
        if (result.startsWith(this.host)) {
            return true;
        }
        return false;
    }

    getFileExtension(url) {
        const extension = url.split('.').reverse()[0].split('?')[0];
        return (extension.endsWith('/')) ? '/' : extension;
    }

    getTTL(url) {
        if (typeof url === 'string') {
            const extension = this.getFileExtension(url);
            return ~this.TTL_EXCEPTIONS.indexOf(extension) ?
                null : this.MAX_TTL;
        }
        return null;
    }

    async installServiceWorker() {
        try {
            await caches.open(this.CACHE_NAME).then((cache) => {
                return cache.addAll(this.BASE_CACHE_FILES);
            }, err => console.error(`Error with ${this.CACHE_NAME}`, err));
            return this.scope.skipWaiting();
        }
        catch (err) {
            return console.error("Error with installation: ", err);
        }
    }

    cleanupLegacyCache() {

        const currentCaches = [this.CACHE_NAME];

        return new Promise(
            (resolve, reject) => {
                caches.keys()
                    .then((keys) => keys.filter((key) => !~currentCaches.indexOf(key)))
                    .then((legacy) => {
                        if (legacy.length) {
                            Promise.all(legacy.map((legacyKey) => caches.delete(legacyKey))
                            ).then(() => resolve()).catch((err) => {
                                //console.error("Error in legacy cleanup: ", err);
                                reject(err);
                            });
                        } else {
                            resolve();
                        }
                    }).catch((err) => {
                        //console.error("Error in legacy cleanup: ", err);
                        reject(err);
                    });
            });
    }

    async preCacheUrl(url) {
        const cache = await caches.open(this.CACHE_NAME);
        const response = await cache.match(url);
        if (!response) {
            return fetch(url).then(resp => cache.put(url, resp.clone()));
        }
        return null;
    }

    register() {
        this.scope.addEventListener('install', event => {
            event.waitUntil(
                Promise.all([
                    this.installServiceWorker(),
                    this.scope.skipWaiting(),
                ]));
        });

        this.scope.addEventListener('activate', event => {
            event.waitUntil(Promise.all(
                [this.cleanupLegacyCache(),
                this.scope.clients.claim(),
                this.scope.skipWaiting()]).catch((err) => {
                    console.error("Activation error: ", err);
                    event.skipWaiting();
                }));
        });

        this.scope.addEventListener('fetch', e => {
            e.respondWith(caches.match(e.request).then(r =>{
                if (r){
                    if (r.status == 400){
                        return caches.match(this.NOT_FOUND_PAGE);
                    }
                    return r;
                }
                return fetch(e.request.clone()).then(r=>{
                    if (!r || r.status !=200 || r.type !=="basic"){
                        return r;
                    }
                    if (this.canCache(e.request.url)){
                        var response = r.clone();
                        caches.open(this.CACHE_NAME).then(c =>{
                            c.put(e.request, response);
                        });
                    }
                    return r;
                }).catch(()=>{
                    return caches.match(this.OFFLINE_PAGE);
                });
            }));
        });
    }
}

const pwa = new Pwa(self);
pwa.register();