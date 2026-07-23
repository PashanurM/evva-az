(function () {
  try {
    var t = localStorage.getItem("evva-theme");
    if (t === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
      if (document.body) document.body.classList.add("dark");
    }
  } catch (e) {}

  function isExtensionNoise(msg, src, stack) {
    var hay = String(msg || "") + String(src || "") + String(stack || "");
    return (
      hay.indexOf("chrome-extension://") !== -1 ||
      hay.indexOf("moz-extension://") !== -1 ||
      hay.indexOf("MetaMask") !== -1 ||
      hay.indexOf("Failed to connect to MetaMask") !== -1 ||
      hay.indexOf("MetaMask extension not found") !== -1 ||
      hay.indexOf("Error restoring session") !== -1
    );
  }

  window.addEventListener(
    "error",
    function (e) {
      if (isExtensionNoise(e.message, e.filename, e.error && e.error.stack)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return true;
      }
    },
    true,
  );

  window.addEventListener(
    "unhandledrejection",
    function (e) {
      var r = e.reason;
      var m = r && r.message ? r.message : String(r || "");
      var s = r && r.stack ? r.stack : "";
      if (isExtensionNoise(m, "", s)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );

  var origError = console.error;
  console.error = function () {
    var hay = Array.prototype.slice.call(arguments).map(String).join(" ");
    if (isExtensionNoise(hay)) return;
    return origError.apply(console, arguments);
  };
})();
