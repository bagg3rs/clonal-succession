// Prints the front page's narration script as JSON: one entry per step, each a list
// of sentences, in the same order the page shows them (title, paragraphs, quotes).
// Used by tools/make-narration.py. Run: node tools/narration-text.js
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const m = html.match(/\/\/ -+ content\n([\s\S]*?)\/\/ -+ drawing helpers/);
if (!m) throw new Error("content block not found in index.html");
const { STEPS } = new Function(`${m[1]}; return { STEPS };`)();

const strip = s => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const sentence = s => (/[.?!]["”’]?$/.test(s) ? s : s + ".");

const out = STEPS.map((s, i) => {
  const parts = [s.title];
  for (const p of s.body.split(/<\/p>/)) if (strip(p)) parts.push(strip(p));
  let prev = null;                               // keep in step with sentencesFor() in index.html
  for (const q of s.quotes) {
    const who = q.elaine ? "Elaine Marshall’s" : "Bruce’s";
    parts.push((who === prev ? "And again: " : "In " + who + " words: ") + q.q.replace(/^…|…$/g, ""));
    prev = who;
  }
  const text = parts.map(sentence).join(" ");
  return { step: i + 1, sentences: (text.match(/[^.?!]+[.?!]+["”’]?/g) || []).map(t => t.trim()) };
});
process.stdout.write(JSON.stringify(out, null, 1));
