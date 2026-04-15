// =============================================================
// question-renderers.js
// Shared renderer library – used by practice.js and challenge.js
//
// Public API:
//   renderQuestionByType(fb, root)   — main entry point
//   showFeedback(root, ok, explainCorrect, explainWrong)
//
// Supported types:
//   quiz | trueFalse | multiSelect | order | fill
//   predictOutput | debug | match | indent | dragIntoCode
// =============================================================

/* ---- private helpers ---- */

function _pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const _PRAISE_OK  = ["אלופה! 💪", "מעולה!! 🚀", "איזה תותח/ית 😎", "וואו, זה מדויק! 🎯", "יש! המשך/י ככה ⭐"];
const _PRAISE_TRY = ["כמעט! 🔁 נסה/י שוב", "עוד רגע את/ה שם 😉", "בדוק/י שוב ותנסה/י", "לא נורא—עוד ניסיון אחד 💡"];

function _escapeHtml(s) {
  return (s ?? "")
    .replaceAll("&",  "&amp;")
    .replaceAll("<",  "&lt;")
    .replaceAll(">",  "&gt;")
    .replaceAll('"',  "&quot;")
    .replaceAll("'",  "&#039;");
}

// Normalise whitespace for text comparison (no dependency on runner.js)
function _normalize(s) {
  return (s ?? "").toString().trim().replace(/\r\n/g, "\n");
}

// Custom dropdown – replaces native <select> so the OS doesn't override the dark theme.
// Returns { el: wrapperElement, getValue: () => string }
function _makeCustomSelect(options, placeholder, ariaLabel) {
  let selectedValue = "";
  if (!window.__qrDropdowns) window.__qrDropdowns = new Set();

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:relative; flex:1;";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btnGhost";
  btn.style.cssText = "width:100%; display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:14px; direction:rtl; text-align:right; padding:10px 14px;";
  btn.setAttribute("aria-label", ariaLabel);
  btn.setAttribute("aria-haspopup", "listbox");
  btn.setAttribute("aria-expanded", "false");

  const btnText = document.createElement("span");
  btnText.textContent = placeholder;
  btnText.style.color = "var(--muted)";

  const arrow = document.createElement("span");
  arrow.textContent = "▾";
  arrow.style.cssText = "opacity:.55; font-size:11px; flex-shrink:0; transition:transform .15s;";

  btn.appendChild(btnText);
  btn.appendChild(arrow);

  const dropdown = document.createElement("div");
  dropdown.style.cssText = [
    "position:absolute",
    "top:calc(100% + 6px)",
    "right:0",
    "min-width:100%",
    "background:var(--surface,#fff)",
    "border:1.5px solid var(--border,#DDE4EF)",
    "border-radius:14px",
    "box-shadow:0 8px 32px rgba(30,41,59,.14)",
    "z-index:300",
    "overflow-y:auto",
    "max-height:220px",
    "display:none",
    "padding:4px 0",
  ].join(";");
  dropdown.setAttribute("role", "listbox");
  window.__qrDropdowns.add(dropdown);

  function close() {
    dropdown.style.display = "none";
    btn.setAttribute("aria-expanded", "false");
    arrow.style.transform = "";
  }
  function open() {
    window.__qrDropdowns.forEach(d => { if (d !== dropdown) d.style.display = "none"; });
    dropdown.style.display = "block";
    btn.setAttribute("aria-expanded", "true");
    arrow.style.transform = "rotate(180deg)";
  }

  options.forEach(opt => {
    const item = document.createElement("div");
    item.setAttribute("role", "option");
    item.textContent = opt;
    item.style.cssText = "padding:10px 16px; cursor:pointer; font-size:14px; color:var(--text,#1E293B); direction:rtl; text-align:right; transition:background .1s;";
    item.addEventListener("mouseenter", () => { item.style.background = "var(--tealBg,#EAFAFA)"; });
    item.addEventListener("mouseleave", () => { item.style.background = selectedValue === opt ? "var(--tealBg,#EAFAFA)" : ""; });
    item.addEventListener("mousedown", e => e.preventDefault());
    item.addEventListener("click", () => {
      dropdown.querySelectorAll("[role='option']").forEach(o => o.style.background = "");
      selectedValue = opt;
      item.style.background = "var(--tealBg,#EAFAFA)";
      btnText.textContent = opt;
      btnText.style.color = "var(--text,#1E293B)";
      close();
    });
    dropdown.appendChild(item);
  });

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.style.display === "none" ? open() : close();
  });
  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) close();
  });

  wrapper.appendChild(btn);
  wrapper.appendChild(dropdown);

  return { el: wrapper, getValue: () => selectedValue };
}

/* ---- private: clear feedback from root and dedicated feedback area ---- */
function _clearFeedback(root) {
  root.querySelectorAll(".status, .mini.answer").forEach(el => el.remove());
  const ded = document.getElementById("practiceAreaFeedback");
  if (ded) ded.innerHTML = "";
}

/* ---- public: feedback helper ---- */

/**
 * Writes feedback into the dedicated #practiceAreaFeedback div when
 * present (prevents the הבא button from jumping), otherwise appends to root.
 */
function showFeedback(root, ok, explainCorrect, explainWrong) {
  _clearFeedback(root);

  const msg = document.createElement("div");
  msg.className = ok ? "status good" : "status bad";
  msg.textContent = ok
    ? ("✅ " + _pick(_PRAISE_OK))
    : ("❌ " + _pick(_PRAISE_TRY));

  const exp = document.createElement("p");
  exp.className = "mini answer";
  exp.textContent = ok ? (explainCorrect ?? "") : (explainWrong ?? "");

  const target = document.getElementById("practiceAreaFeedback") ?? root;
  target.appendChild(msg);
  target.appendChild(exp);
}

/* ---- public: entry point ---- */

/**
 * Renders any supported question type into `root`.
 * The `fallback` / `step` object must have a `type` field.
 */
function renderQuestionByType(fb, root) {
  if (!fb || !root) return;
  switch (fb.type) {
    case "quiz":          renderQuiz(fb, root);          break;
    case "trueFalse":     renderTrueFalse(fb, root);     break;
    case "multiSelect":   renderMultiSelect(fb, root);   break;
    case "order":         renderOrder(fb, root);         break;
    case "fill":          renderFill(fb, root);          break;
    case "predictOutput": renderPredictOutput(fb, root); break;
    case "debug":         renderDebug(fb, root);         break;
    case "match":         renderMatch(fb, root);         break;
    case "indent":        renderIndent(fb, root);        break;
    case "dragIntoCode":  renderDragIntoCode(fb, root);  break;
    default:
      root.innerHTML = "<p class='mini'>סוג תרגול לא מוכר: " + _escapeHtml(fb.type) + "</p>";
  }
}

/* ============================================================
   EXISTING RENDERERS  (canonical – replaces copies in
   practice.js and challenge.js)
   ============================================================ */

function renderQuiz(fb, root) {
  const box = document.createElement("div");
  box.className = "text";
  box.innerHTML = `<p><b>${_escapeHtml(fb.question)}</b></p>`;

  const list = document.createElement("div");
  list.className = "grid";

  fb.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "tile";
    btn.type = "button";
    btn.textContent = opt;

    btn.onclick = () => {
      const ok = idx === fb.correctIndex;
      showFeedback(root, ok, fb.explainCorrect, fb.explainWrong ?? "רמז: חזור להסבר למעלה 😉");
    };

    list.appendChild(btn);
  });

  root.appendChild(box);
  root.appendChild(list);
}

function renderTrueFalse(fb, root) {
  // Delegates to renderQuiz with fixed two-option setup.
  renderQuiz({
    question:      fb.question,
    options:       ["נכון ✓", "לא נכון ✗"],
    correctIndex:  fb.correct ? 0 : 1,
    explainCorrect: fb.explainCorrect,
    explainWrong:   fb.explainWrong,
  }, root);
}

function renderMultiSelect(fb, root) {
  const box = document.createElement("div");
  box.className = "text";
  box.innerHTML  = `<p><b>${_escapeHtml(fb.question)}</b></p>`;
  box.innerHTML += `<p class="mini">בחרו את <em>כל</em> התשובות הנכונות.</p>`;

  const list = document.createElement("div");
  list.className = "grid";
  const selected = new Set();

  fb.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "tile";
    btn.type = "button";
    btn.textContent = opt;
    btn.setAttribute("aria-pressed", "false");

    btn.onclick = () => {
      if (selected.has(idx)) {
        selected.delete(idx);
        btn.style.outline = "";
        btn.setAttribute("aria-pressed", "false");
      } else {
        selected.add(idx);
        btn.style.outline = "2px solid rgba(96,165,250,.65)";
        btn.setAttribute("aria-pressed", "true");
      }
    };

    list.appendChild(btn);
  });

  const actions = document.createElement("div");
  actions.className = "orderActions";

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn";
  checkBtn.textContent = "בדוק ✅";
  checkBtn.onclick = () => {
    const correct = new Set(fb.correctIndexes);
    const ok = selected.size === correct.size && [...selected].every(i => correct.has(i));
    showFeedback(root, ok, fb.explainCorrect, fb.explainWrong);
  };

  actions.appendChild(checkBtn);
  root.appendChild(box);
  root.appendChild(list);
  root.appendChild(actions);
}

function renderOrder(fb, root) {
  const p = document.createElement("p");
  p.className = "text";
  p.innerHTML = `<b>${_escapeHtml(fb.prompt)}</b>`;
  root.appendChild(p);

  const wrap = document.createElement("div");
  wrap.className = "orderWrap";

  const pieces = [...fb.pieces].sort(() => Math.random() - 0.5);

  pieces.forEach((line) => {
    const row = document.createElement("div");
    row.className = "orderItem";
    row.draggable = true;
    row.dataset.value = line;
    row.setAttribute("aria-grabbed", "false");

    row.innerHTML = `
      <div class="orderGrip" aria-hidden="true">≡</div>
      <div class="orderCode">${_escapeHtml(line)}</div>
    `;

    row.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", line);
      row.setAttribute("aria-grabbed", "true");
    });
    row.addEventListener("dragend",  () => row.setAttribute("aria-grabbed", "false"));
    row.addEventListener("dragover",  (e) => { e.preventDefault(); row.classList.add("dragOver"); });
    row.addEventListener("dragleave", () => row.classList.remove("dragOver"));
    row.addEventListener("drop", (e) => {
      e.preventDefault();
      row.classList.remove("dragOver");
      const draggedValue = e.dataTransfer.getData("text/plain");
      const draggedEl = [...wrap.children].find(x => x.dataset.value === draggedValue);
      if (!draggedEl || draggedEl === row) return;
      wrap.insertBefore(draggedEl, row);
    });

    wrap.appendChild(row);
  });

  root.appendChild(wrap);

  const actions = document.createElement("div");
  actions.className = "orderActions";

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn";
  checkBtn.textContent = "בדוק סדר ✅";
  checkBtn.onclick = () => {
    const current = [...wrap.children].map(el => el.dataset.value);
    const ok = current.join("\n") === fb.correct.join("\n");
    showFeedback(root, ok, fb.explainCorrect, fb.explainWrong);
  };

  actions.appendChild(checkBtn);
  root.appendChild(actions);
}

function renderFill(fb, root) {
  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.gap = "12px";

  const sentence = document.createElement("div");
  sentence.className = "hint";
  sentence.style.direction = "ltr";
  sentence.style.textAlign = "left";

  const blanks = fb.blanks.map(() => ({ value: "" }));

  function renderSentence() {
    sentence.innerHTML = "";
    const line = document.createElement("div");
    line.style.display = "flex";
    line.style.flexWrap = "wrap";
    line.style.gap = "10px";
    line.style.alignItems = "center";

    fb.promptParts.forEach((part, i) => {
      const t = document.createElement("span");
      t.style.fontFamily = "ui-monospace, Menlo, Consolas, monospace";
      t.textContent = part;
      line.appendChild(t);

      if (i < fb.blanks.length) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn btnGhost";
        b.style.fontFamily = "ui-monospace, Menlo, Consolas, monospace";
        b.style.direction = "ltr";
        b.style.textAlign = "left";
        b.textContent = blanks[i].value || "____";
        b.setAttribute("aria-label", blanks[i].value ? `הסר ${blanks[i].value}` : "תיבה ריקה");

        b.onclick = () => {
          blanks[i].value = "";
          renderSentence();
        };

        line.appendChild(b);
      }
    });

    sentence.appendChild(line);
  }

  const bankTitle = document.createElement("p");
  bankTitle.className = "text";
  bankTitle.innerHTML = "<b>בחרו מילים כדי להשלים:</b>";

  const bankBox = document.createElement("div");
  bankBox.className = "grid";

  fb.bank.forEach(word => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile";
    btn.style.fontFamily = "ui-monospace, Menlo, Consolas, monospace";
    btn.style.direction = "ltr";
    btn.style.textAlign = "left";
    btn.textContent = word;

    btn.onclick = () => {
      const idx = blanks.findIndex(b => !b.value);
      if (idx === -1) return;
      blanks[idx].value = word;
      renderSentence();
    };

    bankBox.appendChild(btn);
  });

  const actions = document.createElement("div");
  actions.className = "row";
  actions.style.justifyContent = "flex-end";

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn";
  checkBtn.textContent = "בדוק ✅";

  const resetBtn = document.createElement("button");
  resetBtn.className = "btn btnGhost";
  resetBtn.textContent = "אפס";

  checkBtn.onclick = () => {
    const ok = fb.blanks.every((b, i) =>
      _normalize(blanks[i].value) === _normalize(b.correct)
    );
    showFeedback(root, ok, fb.explainCorrect, fb.explainWrong);
  };

  resetBtn.onclick = () => {
    blanks.forEach(b => b.value = "");
    renderSentence();
    _clearFeedback(root);
  };

  actions.appendChild(checkBtn);
  actions.appendChild(resetBtn);
  wrap.appendChild(sentence);
  wrap.appendChild(bankTitle);
  wrap.appendChild(bankBox);
  wrap.appendChild(actions);
  root.appendChild(wrap);

  renderSentence();
}

/* ============================================================
   NEW RENDERERS
   ============================================================ */

/* ---------- predictOutput ----------
 * Show a read-only code block, then multiple-choice options.
 * Schema:
 * {
 *   type: "predictOutput",
 *   question: "מה יודפס?",
 *   code: "x = 3\nprint(x * 4)",
 *   options: ["3", "4", "12", "7"],
 *   correctIndex: 2,
 *   explainCorrect: "3 * 4 = 12",
 *   explainWrong: "שים לב לאופרטור *"
 * }
 */
function renderPredictOutput(fb, root) {
  const q = document.createElement("p");
  q.className = "text";
  q.innerHTML = `<b>${_escapeHtml(fb.question)}</b>`;
  root.appendChild(q);

  const pre = document.createElement("pre");
  pre.className = "output";
  pre.style.marginBottom = "14px";
  pre.textContent = fb.code;
  root.appendChild(pre);

  const list = document.createElement("div");
  list.className = "grid";

  fb.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "tile";
    btn.type = "button";
    btn.style.fontFamily = "ui-monospace, Menlo, Consolas, monospace";
    btn.style.direction = "ltr";
    btn.style.textAlign = "left";
    btn.textContent = opt;

    btn.onclick = () => {
      const ok = idx === fb.correctIndex;
      showFeedback(root, ok, fb.explainCorrect, fb.explainWrong);
    };

    list.appendChild(btn);
  });

  root.appendChild(list);
}

/* ---------- debug ----------
 * Editable textarea pre-filled with broken code.
 * Compare normalised user text to `solution`.
 * Schema:
 * {
 *   type: "debug",
 *   question: "מצאו ותקנו את הבאג:",
 *   starterCode: "print('hello world'",
 *   solution: "print('hello world')",
 *   explainCorrect: "חסר סוגר סגירה",
 *   explainWrong: "בדקו את הסוגריים"
 * }
 */
function renderDebug(fb, root) {
  const q = document.createElement("p");
  q.className = "text";
  q.innerHTML = `<b>${_escapeHtml(fb.question)}</b>`;
  root.appendChild(q);

  const textarea = document.createElement("textarea");
  textarea.className = "editor";
  textarea.value = fb.starterCode ?? "";
  textarea.spellcheck = false;
  textarea.style.minHeight = "120px";
  textarea.setAttribute("aria-label", "ערוך את הקוד כדי לתקן את הבאג");
  root.appendChild(textarea);

  const actions = document.createElement("div");
  actions.className = "orderActions";

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn";
  checkBtn.textContent = "בדוק ✅";

  const resetBtn = document.createElement("button");
  resetBtn.className = "btn btnGhost";
  resetBtn.textContent = "אפס";

  checkBtn.onclick = () => {
    const ok = _normalize(textarea.value) === _normalize(fb.solution);
    showFeedback(root, ok, fb.explainCorrect, fb.explainWrong);
  };

  resetBtn.onclick = () => {
    textarea.value = fb.starterCode ?? "";
    _clearFeedback(root);
  };

  actions.appendChild(checkBtn);
  actions.appendChild(resetBtn);
  root.appendChild(actions);
}

/* ---------- match ----------
 * Left column: fixed labels. Right column: a dropdown per row.
 * All dropdowns share the same options list (shuffled once).
 * Schema:
 * {
 *   type: "match",
 *   question: "חברו כל מושג להגדרה שלו:",
 *   lefts:  ["print()", "input()", "len()"],
 *   rights: ["מדפיס פלט", "קורא קלט", "מחזיר אורך", "מחשב ערך"],
 *   correctPairs: {
 *     "print()": "מדפיס פלט",
 *     "input()": "קורא קלט",
 *     "len()":   "מחזיר אורך"
 *   },
 *   explainCorrect: "כל אחד בתפקידו!",
 *   explainWrong:   "נסו שוב"
 * }
 */
function renderMatch(fb, root) {
  const q = document.createElement("p");
  q.className = "text";
  q.innerHTML = `<b>${_escapeHtml(fb.question)}</b>`;
  root.appendChild(q);

  const table = document.createElement("div");
  table.style.display = "grid";
  table.style.gap = "10px";

  const getters = {};
  const shuffledRights = [...fb.rights].sort(() => Math.random() - 0.5);

  fb.lefts.forEach(left => {
    const row = document.createElement("div");
    row.className = "orderItem matchRow";
    row.style.cssText = "cursor:default; gap:14px; align-items:center;";

    const leftEl = document.createElement("code");
    leftEl.style.cssText = "font-size:14px; font-weight:700; padding:5px 12px; flex-shrink:0; white-space:nowrap;";
    leftEl.textContent = left;

    const { el, getValue } = _makeCustomSelect(
      shuffledRights,
      "בחר/י...",
      `התאמה עבור ${left}`
    );

    getters[left] = getValue;
    row.appendChild(leftEl);
    row.appendChild(el);
    table.appendChild(row);
  });

  root.appendChild(table);

  const actions = document.createElement("div");
  actions.className = "orderActions";

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn";
  checkBtn.textContent = "בדוק ✅";
  checkBtn.onclick = () => {
    const ok = fb.lefts.every(left => getters[left]() === fb.correctPairs[left]);
    showFeedback(root, ok, fb.explainCorrect, fb.explainWrong);
  };

  actions.appendChild(checkBtn);
  root.appendChild(actions);
}

/* ---------- indent ----------
 * Each code line starts at indent 0. ◀ / ▶ buttons increase/decrease
 * indentation level (capped 0–maxIndent). Compare to `solution` array.
 * Schema:
 * {
 *   type: "indent",
 *   question: "הכניסו הזחה נכונה לכל שורה:",
 *   lines: ["def greet():", "name = 'Alice'", "print(name)"],
 *   solution: [0, 1, 1],
 *   maxIndent: 3,               // optional, default 3
 *   explainCorrect: "מעולה!",
 *   explainWrong: "שים לב מה בתוך הפונקציה"
 * }
 */
function renderIndent(fb, root) {
  const q = document.createElement("p");
  q.className = "text";
  q.innerHTML = `<b>${_escapeHtml(fb.question)}</b>`;
  root.appendChild(q);

  const wrap = document.createElement("div");
  wrap.className = "orderWrap";

  const maxIndent = fb.maxIndent ?? 3;
  const levels = fb.lines.map(() => 0);

  fb.lines.forEach((line, i) => {
    const row = document.createElement("div");
    row.className = "orderItem";
    row.style.cursor = "default";
    row.style.gap = "8px";

    const decreaseBtn = document.createElement("button");
    decreaseBtn.type = "button";
    decreaseBtn.className = "btn btnGhost";
    decreaseBtn.textContent = "◀";
    decreaseBtn.style.padding = "4px 10px";
    decreaseBtn.style.minWidth = "36px";
    decreaseBtn.setAttribute("aria-label", "הפחת הזחה");

    const levelDisplay = document.createElement("div");
    levelDisplay.className = "orderGrip";
    levelDisplay.textContent = "0";
    levelDisplay.setAttribute("aria-live", "polite");
    levelDisplay.setAttribute("aria-label", `רמת הזחה: 0`);

    const increaseBtn = document.createElement("button");
    increaseBtn.type = "button";
    increaseBtn.className = "btn btnGhost";
    increaseBtn.textContent = "▶";
    increaseBtn.style.padding = "4px 10px";
    increaseBtn.style.minWidth = "36px";
    increaseBtn.setAttribute("aria-label", "הוסף הזחה");

    const code = document.createElement("div");
    code.className = "orderCode";
    code.textContent = line; // visual indent is padding, not spaces

    function updateLevel(delta) {
      levels[i] = Math.max(0, Math.min(maxIndent, levels[i] + delta));
      levelDisplay.textContent = levels[i];
      levelDisplay.setAttribute("aria-label", `רמת הזחה: ${levels[i]}`);
      code.style.paddingLeft = (levels[i] * 24) + "px";
    }

    decreaseBtn.onclick = () => updateLevel(-1);
    increaseBtn.onclick = () => updateLevel(1);

    row.appendChild(decreaseBtn);
    row.appendChild(levelDisplay);
    row.appendChild(increaseBtn);
    row.appendChild(code);
    wrap.appendChild(row);
  });

  root.appendChild(wrap);

  const actions = document.createElement("div");
  actions.className = "orderActions";

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn";
  checkBtn.textContent = "בדוק ✅";
  checkBtn.onclick = () => {
    const ok = levels.every((l, i) => l === fb.solution[i]);
    showFeedback(root, ok, fb.explainCorrect, fb.explainWrong);
  };

  actions.appendChild(checkBtn);
  root.appendChild(actions);
}

/* ---------- dragIntoCode ----------
 * Like `fill` but with drag-and-drop as the primary interaction,
 * click as fallback (for mobile / accessibility).
 * Blank slots are rendered inline inside a code block.
 * Schema:
 * {
 *   type: "dragIntoCode",
 *   question: "גרור/י או לחץ/י על מילה כדי להשלים:",
 *   promptParts: ["for i in ", "(", "):"],
 *   blanks: [
 *     { correct: "range" },
 *     { correct: "5" }
 *   ],
 *   bank: ["range", "5", "len", "10", "print"],
 *   explainCorrect: "range(5) יוצר מספרים 0-4",
 *   explainWrong: "איזו פונקציה יוצרת רצף מספרים?"
 * }
 */
function renderDragIntoCode(fb, root) {
  const q = document.createElement("p");
  q.className = "text";
  q.innerHTML = `<b>${_escapeHtml(fb.question)}</b>`;
  root.appendChild(q);

  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.gap = "12px";

  const codeDisplay = document.createElement("div");
  codeDisplay.className = "hint";
  codeDisplay.style.direction = "ltr";
  codeDisplay.style.textAlign = "left";

  const blanks = fb.blanks.map(() => ({ value: "" }));

  function renderCode() {
    codeDisplay.innerHTML = "";

    const line = document.createElement("div");
    line.style.display = "flex";
    line.style.flexWrap = "wrap";
    line.style.gap = "4px";
    line.style.alignItems = "center";
    line.style.fontFamily = "ui-monospace, Menlo, Consolas, monospace";
    line.style.fontSize = "14px";

    fb.promptParts.forEach((part, i) => {
      if (part) {
        const t = document.createElement("span");
        t.textContent = part;
        t.style.whiteSpace = "pre";
        line.appendChild(t);
      }

      if (i < fb.blanks.length) {
        const filled = !!blanks[i].value;
        const slot = document.createElement("div");
        slot.style.display = "inline-flex";
        slot.style.alignItems = "center";
        slot.style.justifyContent = "center";
        slot.style.minWidth = "64px";
        slot.style.minHeight = "32px";
        slot.style.padding = "4px 10px";
        slot.style.borderRadius = "10px";
        slot.style.border = filled
          ? "1px solid rgba(96,165,250,.45)"
          : "2px dashed rgba(255,255,255,0.28)";
        slot.style.background = filled
          ? "rgba(96,165,250,.15)"
          : "rgba(255,255,255,0.04)";
        slot.style.color = filled
          ? "var(--text)"
          : "rgba(234,242,255,0.35)";
        slot.style.cursor = filled ? "pointer" : "default";
        slot.style.transition = "background .15s, border .15s";
        slot.textContent = blanks[i].value || "___";
        slot.setAttribute("aria-label",
          filled ? `הסר ${blanks[i].value}` : `תיבה ריקה מספר ${i + 1}`);
        slot.setAttribute("role", "button");
        slot.setAttribute("tabindex", "0");
        slot.dataset.slotIndex = i;

        // Drag-over highlight
        slot.addEventListener("dragover", (e) => {
          e.preventDefault();
          slot.style.background = "rgba(96,165,250,.30)";
        });
        slot.addEventListener("dragleave", () => {
          slot.style.background = filled
            ? "rgba(96,165,250,.15)" : "rgba(255,255,255,0.04)";
        });
        slot.addEventListener("drop", (e) => {
          e.preventDefault();
          const word = e.dataTransfer.getData("text/plain");
          if (word) { blanks[i].value = word; renderCode(); }
        });

        // Click to clear
        if (filled) {
          slot.onclick = () => { blanks[i].value = ""; renderCode(); };
          slot.onkeydown = (e) => {
            if (e.key === "Enter" || e.key === " ") { blanks[i].value = ""; renderCode(); }
          };
        }

        line.appendChild(slot);
      }
    });

    codeDisplay.appendChild(line);
  }

  const bankTitle = document.createElement("p");
  bankTitle.className = "text";
  bankTitle.innerHTML = "<b>גרור/י (או לחץ/י) על מילה כדי למקם אותה:</b>";

  const bankBox = document.createElement("div");
  bankBox.className = "grid";

  fb.bank.forEach(word => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile";
    btn.draggable = true;
    btn.style.fontFamily = "ui-monospace, Menlo, Consolas, monospace";
    btn.style.direction = "ltr";
    btn.style.textAlign = "left";
    btn.textContent = word;

    btn.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", word);
    });

    // Click fallback: fill next empty slot
    btn.onclick = () => {
      const idx = blanks.findIndex(b => !b.value);
      if (idx === -1) return;
      blanks[idx].value = word;
      renderCode();
    };

    bankBox.appendChild(btn);
  });

  const actions = document.createElement("div");
  actions.className = "row";
  actions.style.justifyContent = "flex-end";

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn";
  checkBtn.textContent = "בדוק ✅";

  const resetBtn = document.createElement("button");
  resetBtn.className = "btn btnGhost";
  resetBtn.textContent = "אפס";

  checkBtn.onclick = () => {
    const ok = fb.blanks.every((b, i) =>
      _normalize(blanks[i].value) === _normalize(b.correct)
    );
    showFeedback(root, ok, fb.explainCorrect, fb.explainWrong);
  };

  resetBtn.onclick = () => {
    blanks.forEach(b => b.value = "");
    renderCode();
    _clearFeedback(root);
  };

  actions.appendChild(checkBtn);
  actions.appendChild(resetBtn);
  wrap.appendChild(codeDisplay);
  wrap.appendChild(bankTitle);
  wrap.appendChild(bankBox);
  wrap.appendChild(actions);
  root.appendChild(wrap);

  renderCode();
}
