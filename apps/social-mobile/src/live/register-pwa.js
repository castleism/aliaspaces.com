(() => {
  "use strict";

  if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
  navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {
    /* Install can fail on file: or restrictive WebView. The APK launchers still install the surfaces. */
  });
})();
