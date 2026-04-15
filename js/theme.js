/* theme.js — Dark / Light theme toggle
   Injects the toggle button into .top and persists preference in localStorage */

(function () {
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
  }

  var saved = localStorage.getItem("mindplay-theme") || "dark";
  applyTheme(saved);

  /* Script is loaded at end of <body> so DOM is already ready — no need for DOMContentLoaded */
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

  function _updateIcon(btn, theme) {
    btn.textContent = theme === "dark" ? "☀" : "🌑";
  }
})();
