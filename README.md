# Clonal Succession

An idea from Bruce Baguley, a cancer researcher in Auckland, about how tumours keep themselves going.

**Live site:** [bagg3rs.github.io/clonal-succession](https://bagg3rs.github.io/clonal-succession/)

## The idea

Healthy tissue renews itself in turns. One stem cell produces a family of cells (a clone), that family works,
ages and dies out, and then another stem cell takes over. The common view of cancer is that tumour cells are
different because they keep dividing forever.

Bruce's work with Elaine Marshall on cells taken straight from patients suggested otherwise. Their tumour
samples behaved more like normal tissue: the cells were mortal, and new clones kept taking over from old ones.
He calls this clonal succession. If it holds, a drug that works on one clone may not work on the next, and a
surgical sample shows only whichever phase the tumour happened to be in.

## Where it stands

There is a working model of the idea. The open question is what tells a dormant stem cell that its turn has
come. It could be a signal sent to each stem cell, or a change in something they all draw on, such as space or
a shared supply. The model compares two possibilities side by side and nothing yet shows which is right.

The animations here use invented numbers to illustrate the idea. They are not measurements.

## Get involved

This needs more people than the two of us. If you work on stem cells, tumour biology or mathematical modelling,
or know someone who does, please [open an issue](https://github.com/bagg3rs/clonal-succession/issues) or see
[CONTRIBUTING.md](CONTRIBUTING.md).

## What is in this repo

| Path | What it is |
|---|---|
| `index.html` | The site's front page |
| `animations/` | Browser animations of the succession cycle |
| `src/`, `tests/` | The JavaScript simulation and its test pages |
| `docs/`, `models/` | Background notes and the early maths, with status notes on what has changed |
| `archive/` | Earlier plans and setup notes, kept as a record |

Licence: see [LICENSE](LICENSE).
