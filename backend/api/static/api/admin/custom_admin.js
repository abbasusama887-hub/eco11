// ── Fix corrupted Alpine.js persist localStorage values ───────────────────
// Alpine's $persist plugin expects JSON-encoded values (e.g. `"dark"`, `"light"`).
// If a plain string like `dark` was stored directly, JSON.parse throws a
// SyntaxError that prevents Alpine from booting — leaving the page blank.
// We sanitise every localStorage key before Alpine initialises.
(function fixAlpinePersist() {
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (!key) continue;
      var raw = localStorage.getItem(key);
      if (raw === null) continue;
      try {
        JSON.parse(raw);
      } catch (_) {
        // Value is not valid JSON — re-encode it so Alpine can read it.
        // Plain strings like `dark` or `light` need to become `"dark"` / `"light"`.
        localStorage.setItem(key, JSON.stringify(raw));
      }
    }
  } catch (_) {
    // localStorage unavailable (private browsing, etc.) — safe to ignore.
  }
})();

// ── Dashboard entrance animations ─────────────────────────────────────────
(function () {
  const enhanceDashboard = () => {
    document.querySelectorAll(".ndps-stat-card, .ndps-panel").forEach((element, index) => {
      element.style.setProperty("--ndps-delay", `${Math.min(index * 45, 240)}ms`);
      element.classList.add("ndps-enter");
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceDashboard, { once: true });
  } else {
    enhanceDashboard();
  }
})();
