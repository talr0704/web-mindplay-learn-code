/* theme.js — Dark / Light theme toggle */

(function () {
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var btn = document.getElementById("themeToggle");
    if (btn) btn.textContent = t === "dark" ? "☀" : "🌑";
  }

  var saved = localStorage.getItem("mindplay-theme") || "dark";
  applyTheme(saved);

  /* Wait for button to exist (script at end of <body>) */
  var btn = document.getElementById("themeToggle");
  if (btn) {
    btn.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme");
      var next = current === "dark" ? "light" : "dark";
      localStorage.setItem("mindplay-theme", next);
      applyTheme(next);
    });
  }
})();
