/* theme.js — Dark / Light theme toggle
   Injects the toggle button into .top and persists preference in localStorage */

(function () {
  /* Apply immediately (before DOMContentLoaded) to avoid flash — called from <head> */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
  }

  var saved = localStorage.getItem("mindplay-theme") || "dark";
  applyTheme(saved);

  document.addEventListener("DOMContentLoaded", function () {
    var top = document.querySelector(".top");
    if (!top) return;

    var btn = document.createElement("button");
    btn.id = "themeToggle";
    btn.setAttribute("aria-label", "החלף ערכת צבעים");
    btn.title = "החלף ערכת צבעים";
    _updateIcon(btn, saved);

    btn.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme");
      var next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem("mindplay-theme", next);
      _updateIcon(btn, next);
    });

    top.appendChild(btn);
  });

  function _updateIcon(btn, theme) {
    btn.textContent = theme === "dark" ? "☀" : "🌑";
  }
})();
