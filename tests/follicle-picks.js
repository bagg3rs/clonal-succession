// Measures how often the front page's follicle model (step 8) picks two follicles
// in one cycle. Target: about 1 in 100. Run: node tests/follicle-picks.js [runs]
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const m = html.match(/\/\/ -+ follicle model start([\s\S]*?)\/\/ -+ follicle model end/);
if (!m) throw new Error("follicle model block not found in index.html");
const { measureDoubles } = new Function(`${m[1]}; return { measureDoubles };`)();

const runs = Number(process.argv[2]) || 5000;
const rates = [1, 2, 3].map(seed => measureDoubles(runs, seed));
rates.forEach((r, i) => console.log(`seed ${i + 1}: ${(r * 100).toFixed(2)} in 100 over ${runs} runs`));
const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
console.log(`mean: ${(mean * 100).toFixed(2)} in 100`);
if (mean < 0.005 || mean > 0.02) { console.error("outside 0.5–2 in 100"); process.exit(1); }
