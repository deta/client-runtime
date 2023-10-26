const RELEASE_ID = '##RELEASE_ID##'
const CACHE_NAME = `cache-v1-${RELEASE_ID}`;

self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cache_names => {
            return Promise.all(
                cache_names.map(cache_name => {
                    if (cache_name !== CACHE_NAME) {
                        return caches.delete(cache_name);
                    }
                })
            );
        }).then(() => {
            return clients.claim();
        })
    );
});

self.addEventListener('fetch', event => {
    let request = event.request;
    const targets = [
        'database.deta.sh', 'database.deta.space',
        'deta.space/api/base', '/__space/v0/base'];
    const request_url = new URL(event.request.url);

    const is_query_path = request_url.pathname.endsWith('/query');
    const is_query_target = targets.some(target => request_url.href.includes(target));
    const is_query_request = request.method === 'POST' && is_query_path && is_query_target;
    const is_cache_supported = request.method === 'GET' || is_query_request;

    event.respondWith(
        fetch(request.clone())
        .then(async response => {
            if (response.status === 401 && (response.headers.get('Server')?.startsWith('Deta'))) {
                return handle_auth_required(response, event.clientId);
            }

            if (is_cache_supported) {
                const cache_key = request.method === 'POST'
                    ? await generate_post_cache_key(request)
                    : request;

                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(cache_key, response.clone());
                    return response;
                });
            }
            return response;
        })
        .catch(async (error) => {
            if (is_cache_supported) {
                const cache_key = request.method === 'POST'
                    ? await generate_post_cache_key(request)
                    : request;

                const response = await caches.match(cache_key);
                if (response) {
                    return response;
                }
            }

            throw error;
        })
    );
});

async function generate_post_cache_key(request) {
    const body_content = await request.clone().text();
    const raw_key = request.url + '_' + body_content;

    const encoder = new TextEncoder();
    const hash_buffer = await crypto.subtle.digest('SHA-256', encoder.encode(raw_key));
    const hash_array = Array.from(new Uint8Array(hash_buffer));
    const hash = hash_array.map(byte => byte.toString(16).padStart(2, '0')).join('');

    const cache_url = `${request.url}/${hash}`;
    return new Request(cache_url, { method: 'GET' });
}

async function handle_auth_required(response, clientId) {
    const client = await clients.get(clientId);
    if (client) {
        client.postMessage({
            action: 'auth_required',
        });
    }
    return response;
}
