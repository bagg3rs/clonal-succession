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
  // Each part carries who reads it: "rich" for the explanation, "bruce" for his own
  // quotes, "rich" for the lead-in and for Elaine's quote (she has no voice reference).
  const parts = [[s.title, "rich"]];
  for (const p of s.body.split(/<\/p>/)) if (strip(p)) parts.push([strip(p), "rich"]);
  let prev = null;                               // keep in step with sentencesFor() in index.html
  for (const q of s.quotes) {
    const who = q.elaine ? "Elaine Marshall’s" : "Bruce’s";
    parts.push([(who === prev ? "And again: " : "In " + who + " words: "), "rich"]);
    parts.push([q.q.replace(/^…|…$/g, ""), q.elaine ? "rich" : "bruce"]);
    prev = who;
  }
  const sentences = [];
  for (const [text, voice] of parts) {
    if (/: $/.test(text)) { sentences.push({ text: text.trim(), voice }); continue; }  // a lead-in, no full stop
    const t = sentence(text);
    for (const m of t.match(/[^.?!]+[.?!]+["”’]?/g) || [t]) sentences.push({ text: m.trim(), voice });
  }
  return { step: i + 1, sentences };
});
process.stdout.write(JSON.stringify(out, null, 1));
