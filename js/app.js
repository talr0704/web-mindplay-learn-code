function makeTile(ch){
  const a = document.createElement("a");
  a.className = "tile";

  const page = (ch.mode === "practiceOnly") ? "practice.html" : "challenge.html";
  a.href = `./${page}?id=${encodeURIComponent(ch.id)}`;

  a.innerHTML = `
    <div class="tag"># ${ch.topic ?? ""}</div>
    <div class="name">${ch.title ?? ""}</div>
    <div class="desc">${ch.subtitle ?? ""}</div>
  `;
  return a;
}

const basicsBox = document.getElementById("basics");
const projectsBox = document.getElementById("projects");
const grade3Box = document.getElementById("grade3");

CHALLENGES.forEach(ch => {
  const tile = makeTile(ch);

  if (ch.group === "basics") basicsBox.appendChild(tile);
  else if (ch.group === "projects") projectsBox.appendChild(tile);
  else if (ch.group === "grade3") grade3Box.appendChild(tile);
});
