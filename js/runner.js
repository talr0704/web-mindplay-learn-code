let pyodideReady = null;

async function initPyodide() {
  if (pyodideReady) return pyodideReady;

  pyodideReady = (async () => {
    const pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
    });
    return pyodide;
  })();

  return pyodideReady;
}

function indent(text, spaces) {
  const pad = " ".repeat(spaces);
  return text.split("\n").map(line => pad + line).join("\n");
}

// השם נשאר runUserCode כדי לא לשבור לוגיקה קיימת
async function runUserCode(code) {
  const pyodide = await initPyodide();

  const wrapped = `
import sys, io, js
_buffer = io.StringIO()
sys.stdout = _buffer
sys.stderr = _buffer

def input(prompt=""):
    # input() דרך חלון prompt בדפדפן
    try:
        return js.prompt(prompt) or ""
    except Exception:
        return ""

try:
${indent(code, 4)}
except Exception as e:
    print("שגיאה:", e)

sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
_buffer.getvalue()
`;

  try {
    const out = pyodide.runPython(wrapped);
    return { ok: true, output: (out ?? "").toString() };
  } catch (e) {
    return { ok: false, output: "שגיאה: " + e.message };
  }
}

function normalize(s) {
  return (s ?? "").toString().trim().replace(/\r\n/g, "\n");
}

function checkExpected(userOutput, expectedOutput) {
  if (expectedOutput == null) return { canCheck: false, passed: false };
  return {
    canCheck: true,
    passed: normalize(userOutput) === normalize(expectedOutput),
  };
}
