(() => {
    if ('serviceWorker' in navigator) {
        window.addEventListener('DOMContentLoaded', () => {
            navigator.serviceWorker.getRegistration().then((registration) => {
                const service_worker_url = '/__space/v0/assets/service-worker.js';
                if (registration && registration.active && registration.active.scriptURL.endsWith(service_worker_url)) {
                    registration.unregister().then((unregistered) => {
                        if (unregistered) {
                            console.log('space runtime: service worker unregistered successfully');
                        } else {
                            console.error('space runtime: failed to unregister the default service worker');
                        }
                    });
                }
            });
        });
    }
})();
