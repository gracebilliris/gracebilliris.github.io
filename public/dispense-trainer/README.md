# PracticeRx Dispense Trainer

PracticeRx Dispense Trainer is a self-contained static pharmacy-dispensing practice simulator built for workflow rehearsal only. It uses entirely fictional patients, prescribers, medicines, and audit data, and its interface is an original design that is not affiliated with, endorsed by, or copied from any commercial dispensing vendor.

## Current UI style

The interface now uses a denser desktop-dispensing layout inspired by generic enterprise pharmacy software conventions: a title bar, quick-launch ribbon, compact grouped forms, grid-based worklists, and a persistent status bar. It remains an original PracticeRx design and does not reproduce any vendor branding, screenshots, trademarked feature names, or copyrighted UI copy.

## Keyboard shortcuts

- `Alt+1` Dashboard
- `Alt+2` Patient Search
- `Alt+3` New Script
- `Alt+4` Drug Lookup
- `Alt+5` Final Check
- `Alt+6` History
- `F2` Focus patient/history search in the active view
- `F3` Focus drug search in the active view
- `F4` Add to Queue from New Script
- `F6` Preview label from Final Check
- `F12` Confirm & Dispense from Final Check

## Run locally

Open `index.html` directly in a browser or serve this folder with `python3 -m http.server` from inside `dispense-trainer/`, then visit the local address shown in the terminal. Because everything is plain HTML, CSS, and JavaScript with localStorage persistence, it works offline after loading.
