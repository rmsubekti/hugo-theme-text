(function () {
 const nav = navigator;
  /* Service Worker install */
  const sw = nav.serviceWorker
  if ('serviceWorker' in nav) {
    sw.register('/sw.js', { scope: '/' })
      .then(function (registration) {
        //console.log('Service Worker Registered');
      });

    sw.ready
      .then(function (registration) {
        //console.log('Service Worker Ready');
      });
  }
})();
