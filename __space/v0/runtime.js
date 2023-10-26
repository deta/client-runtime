(() => {
    let manifest = document.querySelector('link[rel="manifest"]');
    if (!manifest) {
        manifest = document.createElement('link');
        manifest.rel = 'manifest';
        manifest.href = '/__space/v0/assets/manifest.json';
        document.head.appendChild(manifest);
    }

    let apple_icon_link = document.querySelector('link[rel="apple-touch-icon"]');
    if (!apple_icon_link) {
        apple_icon_link = document.createElement('link');
        apple_icon_link.rel = 'apple-touch-icon';
        apple_icon_link.href = '/__space/v0/assets/icon-pwa';
        document.head.appendChild(apple_icon_link);
    }

    if ('serviceWorker' in navigator) {
        const service_worker_url = '/__space/v0/assets/service-worker.js';

        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                navigator.serviceWorker.getRegistration().then((registration) => {
                    if (registration && registration.active && !registration.active.scriptURL.endsWith(service_worker_url)) {
                        return;
                    }

                    navigator.serviceWorker.register(service_worker_url, { scope: '/' })
                        .then(registration => {
                            console.log('space runtime: successfully registered the service worker with scope:', registration.scope);

                            navigator.serviceWorker.addEventListener('message', event => {
                                if (event.data.action === 'auth_required') {
                                    const login_url = new URL(`https://staging1.deta.space/login`);
                                    login_url.searchParams.set('redirect_uri', window.location.href);
                                    window.location.href = login_url.href;
                                }
                            });
                        })
                        .catch(error => {
                            console.error('space runtime: failed to register the service worker:', error);
                        });
                });
            }, 5000);
        });
    }
})();
