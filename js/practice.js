const params = new URLSearchParams(location.search);
const id = params.get("id");
const ch = (typeof CHALLENGES !== "undefined") ? CHALLENGES.find(x => x.id === id) : null;

function pick(arr){
  return arr[Math.floor(Math.random() * arr.length)];
}

const PRAISE_OK = ["אלופה! 💪", "מעולה!! 🚀", "איזה תותח/ית 😎", "וואו, זה מדויק! 🎯", "יש! המשך/י ככה ⭐"];
const PRAISE_TRY = ["כמעט! 🔁 נסה/י שוב", "עוד רגע את/ה שם 😉", "לא נורא—עוד ניסיון אחד 💡", "ממש קרוב! תבדוק/י שוב"];

function renderProgressDots(currentIndex, total){
  const el = document.getElementById("progressDots");
  if (!el) return;

  el.innerHTML = "";
  const maxDots = 10;

  if (total <= maxDots){
    for (let i = 0; i < total; i++){
      const d = document.createElement("span");
      d.className = "dot" + (i < currentIndex ? " done" : "") + (i === currentIndex ? " current" : "");
      el.appendChild(d);
    }
    return;
  }

  const windowSize = 10;
  const start = Math.max(0, Math.min(total - windowSize, currentIndex - Math.floor(windowSize/2)));

  for (let i = start; i < start + windowSize; i++){
    const d = document.createElement("span");
    d.className = "dot" + (i < currentIndex ? " done" : "") + (i === currentIndex ? " current" : "");
    el.appendChild(d);
  }
}

function getNextChallengeId(currentId){
  const idx = CHALLENGES.findIndex(x => x.id === currentId);
  if (idx === -1) return null;
  return CHALLENGES[idx + 1]?.id ?? null;
}

function goNext(){
  const nextId = getNextChallengeId(id);
  if (!nextId) {
    alert("🎉 סיימתם את כל האתגרים!");
    location.href = "./index.html";
    return;
  }
  const nextCh = CHALLENGES.find(x => x.id === nextId);
  const page = (nextCh?.mode === "practiceOnly") ? "practice.html" : "challenge.html";
  location.href = `./${page}?id=${encodeURIComponent(nextId)}`;
}

if (!ch) {
  document.body.innerHTML = "<h2 style='padding:20px'>לא נמצא תרגול 😅</h2>";
} else {
  // ✅ theme
  document.body.dataset.group = ch.group ?? "";

  document.title = ch.title;

  document.getElementById("title").textContent = ch.title ?? "";
  document.getElementById("subtitle").textContent = ch.subtitle ?? "";
  document.getElementById("explain").textContent = ch.explain ?? "";
  document.getElementById("task").textContent = ch.task ?? "";

  const hintEl = document.getElementById("hint");
  hintEl.textContent = ch.hint ?? "";
  // document.getElementById("hintBtn").onclick = () => hintEl.classList.toggle("hidden");

  const progressBadge = document.getElementById("progressBadge");
  const idx = CHALLENGES.findIndex(x => x.id === ch.id);
  progressBadge.textContent = `אתגר ${idx + 1} מתוך ${CHALLENGES.length}`;

  // ✅ progress dots
  renderProgressDots(idx, CHALLENGES.length);

  const area = document.getElementById("practiceArea");
  area.innerHTML = "";

  if (!ch.fallback) {
    area.innerHTML = "<p class='mini'>אין תרגול לאתגר הזה.</p>";
  } else {
    renderQuestionByType(ch.fallback, area);
  }

  document.getElementById("nextBtn").onclick = goNext;
}

// Renderers are provided by question-renderers.js (loaded before this file).
