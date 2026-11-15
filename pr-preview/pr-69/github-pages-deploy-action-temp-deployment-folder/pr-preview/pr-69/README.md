# Clonal succession

**[See the idea, step by step →](https://bagg3rs.github.io/clonal-succession/)**

## The idea

Distinguished Emeritus Professor Bruce Baguley spent his career in cancer research. Working with Elaine Marshall, he grew cells straight from patients’ tumours and found they behaved differently from the cell lines labs keep growing for years: in some samples lots of cells were dividing, in others almost none.

His explanation is that tumour cells are mortal, like healthy ones. Each family of cells (a clone) grows from one stem cell, stops, and dies off, and the tumour keeps going because the next stem cell takes over: a relay of clones, or *clonal succession*. If that is right, a drug that works on one family may not work on the next, and a sample tells you which stage the relay was at when it was taken.

## Where it stands

This is an idea, not an established result. It hasn’t been tested, and the animations here use invented numbers to show its shape, not measurements.

The biggest open question is what wakes the next stem cell. It could be a signal sent to each stem cell by the active clone, or a change in something they all draw on, such as room becoming free. The model compares both; neither is established.

## Get involved

If you work on stem cells, tumour sampling or mathematical modelling and can see a way to test this, please [open an issue](https://github.com/bagg3rs/clonal-succession/issues). See [CONTRIBUTING.md](CONTRIBUTING.md) for how to send changes.

## What’s here

| Path | What it is |
|---|---|
| `index.html` | The front page: an animated walk through the idea, quoting Bruce’s memoir draft. One self-contained file that works offline. |
| `v1.html` | The previous front page, with links to the simulation and test pages. |
| `animations/` | The original interactive simulation (`clonal-succession-cycle.html`) and its specs. |
| `src/` | JavaScript for the simulation. |
| `docs/` | Background, research notes, references and the original audio transcript. Some of these describe suppression by the active clone as settled; each carries a status note saying it isn’t. |
| `models/` | The mathematical framework. |
| `tests/` | Browser test pages, and `follicle-picks.js`, which checks the ovary model on the front page picks two follicles about once in 100 cycles (`node tests/follicle-picks.js`). |
| `archive/` | Superseded notes, scripts and the old roadmap. |

## License

MIT. See [LICENSE](LICENSE).
