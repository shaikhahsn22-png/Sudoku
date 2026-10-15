# Sudoku Studio

A vanilla HTML, CSS, and JavaScript frontend for the existing Spring Boot Sudoku solver. No Java files, Maven dependencies, or puzzle files were changed.

## Run

1. Open this project in IntelliJ IDEA and let Maven load.
2. Run `SudokuApplication` with **the project root as its working directory**. The existing controller resolves puzzle paths relative to that directory.
3. Visit **http://localhost:8081/** in a modern browser. Do not open `index.html` directly from the filesystem.

Alternatively, in PowerShell at the project root:

```powershell
.\mvnw.cmd spring-boot:run
```

## Playing

- Select a square, then use the on-screen number pad or keyboard digits 1–9.
- Arrow keys move between squares while the board has focus. Home/End move to the beginning/end of the row. Backspace, Delete, 0, or Erase clears an editable square.
- Original clues are protected. Repeated numbers in a row, column, or box are highlighted immediately. Check Solution also marks entries that differ from the solver's answer; incomplete correct progress is reported separately from a win.
- Hint fills the selected editable square with its correct value. If that square is already correct or fixed, it finds another square that needs help. Hints are unlimited and counted.
- The timer starts when a puzzle is ready, pauses when the tab is hidden or the pause button is pressed, and stops at completion. Paused boards are concealed and disabled. Resume is explicit. Confirmation dialogs also stop the timer while open.
- New Game and difficulty changes ask before replacing an unfinished board with entries. Cancelling preserves the session.
- Save game stores **one slot in this browser's local storage**, including difficulty, board, timer, digit mapping, and hint count. Load saved game restores it after a page reload or browser restart. Saving again replaces the slot. Saving is manual; there is no automatic save or cloud sync. Clearing browser data deletes the save.
- Damaged saves and blocked/full storage show an error without replacing the active board. Saves are validated before loading. A saved game's solution is fetched and validated again when loaded.

## Puzzle selection and backend integration

| Difficulty preset | Existing puzzle files | Original clues |
| --- | --- | --- |
| Easy | `puzzle2.txt` | 50 |
| Medium | `puzzle1.txt`, `puzzle4.txt` | 36, 30 |
| Hard | `puzzle3.txt` | 29 |

These are **relative presets within the supplied collection**, not certified technique-based difficulty ratings. No puzzle generator or external puzzle service is used. New games shuffle digit labels, preserving the original clues' positions, logic, and unique solution. Medium alternates between its two files; other levels vary the digits of their single source puzzle.

`js/puzzles.js` mirrors the original starting boards because the existing API returns only solved boards. Tests compare the catalogue with all four files and independently verify unique solutions. If you edit a source puzzle, update its catalogue entry and rerun the tests.

The app requests `GET /sudoku/solve?file=<catalogue filename>`, parses its existing plain-text response, and checks the result against the clues and Sudoku rules. Solutions are cached in memory for the session. There is no second production solver in JavaScript.

The existing endpoint **writes its `.solution.txt` output file** when called. This behavior is unchanged, and the resource directory must remain writable. Existing filesystem paths also mean running from a packaged JAR without the source directory is not supported by this backend. Resolving those backend constraints would require separately approved Java changes.

## Files

```text
src/main/resources/static/
  index.html          Accessible page, game controls, and confirmation dialog
  css/styles.css      Responsive navy-and-white design
  js/puzzles.js       Puzzle catalogue and digit variations
  js/game.js          Pure Sudoku rules, response parsing, and save validation
  js/app.js           UI, game state, API, timer, and storage
src/test/frontend/
  game.test.mjs       Rules, catalogue, uniqueness, storage validation, optional live API tests
  browser.test.mjs    Chrome interaction and responsive-layout tests
```

## Tests

Tests require Node.js 22+; the application itself does not need Node.js. No npm packages or installation are required.

```powershell
.\mvnw.cmd test
node --test src/test/frontend/game.test.mjs
```

With Spring Boot running on port 8081, include all four live solver endpoints:

```powershell
$env:SUDOKU_API_TEST = '1'
node --test src/test/frontend/game.test.mjs
Remove-Item Env:SUDOKU_API_TEST
```

For browser tests, start a separate headless Chrome instance using an isolated test profile. Keep Spring Boot running. In PowerShell:

```powershell
Start-Process -FilePath 'C:/Program Files/Google/Chrome/Application/chrome.exe' -WindowStyle Hidden -ArgumentList '--headless=new','--remote-debugging-port=9222',"--user-data-dir=$PWD/target/chrome-test-profile",'--no-first-run','--no-default-browser-check','about:blank'
node src/test/frontend/browser.test.mjs
```

The browser script creates and closes its own tab. It clears local storage in that isolated Chrome profile. It does not touch the saves in your normal browser profile. Screenshots are written under `target/frontend-tests/` (ignored by Git).

Verified on this machine: the existing Maven startup test; 13 Node logic/live API tests; and 13 Chrome browser scenarios covering protected clues, keyboard navigation and validation, number pad, erase, conflicts, hints, timer pause/resume, tab visibility, New Game confirmation, Save/Load across reload, damaged saves, denied storage, all difficulties, 320px/390px layouts, completion, solver failure recovery for active and completed games, and retry after an initial connection failure. Desktop and mobile screenshots were visually reviewed. No uncaught JavaScript exceptions were observed. Other browser engines and physical mobile devices have not been tested.
