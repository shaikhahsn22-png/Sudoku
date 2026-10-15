import { SAVE_KEY, DIFFICULTIES, randomPuzzle, shuffledDigits, mappedGrid } from './puzzles.js';
import { peers, conflicts, isComplete, parseSolution, verifySolution, formatTime, validateSave } from './game.js';

const $ = id => document.getElementById(id);
const cells = [];
const numberButtons = [];
const solutionCache = new Map();
let game = null;
let difficulty = 'easy';
let busy = false;
let requestId = 0;
let revealedErrors = new Set();
let overlayAction = null;

function status(message, tone = '') {
  $('status').textContent = message;
  $('status').dataset.tone = tone;
}

function elapsed() {
  return game ? game.elapsed + (game.startedAt === null ? 0 : performance.now() - game.startedAt) : 0;
}

function stopClock() {
  if (game && game.startedAt !== null) { game.elapsed = elapsed(); game.startedAt = null; }
}

function showOverlay(title, message, actionLabel, action) {
  $('board-overlay').hidden = false;
  $('overlay-title').textContent = title;
  $('overlay-message').textContent = message;
  $('overlay-action').hidden = !actionLabel;
  $('overlay-action').textContent = actionLabel || '';
  overlayAction = action;
  // Inert prevents keyboard and assistive technology from entering the covered board.
  $('board').inert = true;
}

function hideOverlay() { $('board-overlay').hidden = true; $('board').inert = false; }

function editable() { return game && !busy && !game.paused && !game.won; }

function updateControls() {
  for (const id of ['erase', 'hint', 'check']) $(id).disabled = !editable();
  for (const button of numberButtons) button.disabled = !editable();
  $('save').disabled = !game || busy;
  $('load').disabled = busy;
  $('new-game').disabled = busy;
  $('pause').disabled = !game || busy || game.won;
  for (const button of document.querySelectorAll('[data-difficulty]')) {
    button.disabled = busy;
    button.setAttribute('aria-pressed', String(button.dataset.difficulty === difficulty));
  }
}

function render() {
  updateControls();
  if (!game) return;
  const duplicateCells = conflicts(game.board);
  const selectedValue = game.board[game.selected];
  cells.forEach((cell, index) => {
    const value = game.board[index];
    cell.textContent = value || '';
    cell.className = 'cell';
    if (game.givens[index]) cell.classList.add('given');
    if (peers(index, game.selected)) cell.classList.add('related');
    if (value && value === selectedValue) cell.classList.add('match');
    if (duplicateCells.has(index)) cell.classList.add('conflict');
    if (revealedErrors.has(index)) cell.classList.add('incorrect');
    if (index === game.selected) cell.classList.add('selected');
    cell.tabIndex = index === game.selected ? 0 : -1;
    cell.setAttribute('aria-label', `Row ${Math.floor(index / 9) + 1}, column ${index % 9 + 1}, ${value || 'empty'}${game.givens[index] ? ', original clue' : ''}${duplicateCells.has(index) || revealedErrors.has(index) ? ', error' : ''}`);
    cell.setAttribute('aria-current', String(index === game.selected));
  });
  numberButtons.forEach((button, i) => button.classList.toggle('number-active', selectedValue === i + 1));
  const filled = game.board.filter(Boolean).length;
  $('progress-text').textContent = `${filled} of 81 filled`;
  $('progress-bar').style.width = `${filled / 81 * 100}%`;
  $('hint-count').textContent = game.hints;
  $('timer').textContent = formatTime(elapsed());
  $('pause-symbol').textContent = game.paused ? '▶' : 'Ⅱ';
  $('pause').setAttribute('aria-label', game.paused ? 'Resume game' : 'Pause game');
  $('puzzle-label').textContent = `${difficulty[0].toUpperCase() + difficulty.slice(1)} / Puzzle ${game.file.match(/\d+/)[0]}`;
}

async function fetchSolution(puzzle) {
  if (solutionCache.has(puzzle.file)) return solutionCache.get(puzzle.file);
  const response = await fetch(`/sudoku/solve?file=${encodeURIComponent(puzzle.file)}`, { signal: AbortSignal.timeout(20000), cache: 'no-store' });
  if (!response.ok) throw new Error(`The solver returned HTTP ${response.status}. Check that Spring Boot is running and the puzzle file is available.`);
  const solution = parseSolution(await response.text(), [...puzzle.grid].map(Number));
  solutionCache.set(puzzle.file, solution);
  return solution;
}

function confirmReplace(title, message) {
  return new Promise(resolve => {
    const dialog = $('confirm-dialog');
    const wasRunning = game && game.startedAt !== null;
    stopClock();
    $('dialog-title').textContent = title;
    $('dialog-message').textContent = message;
    dialog.returnValue = 'cancel';
    dialog.addEventListener('close', () => {
      if (wasRunning && game && !game.paused && !game.won && !document.hidden) game.startedAt = performance.now();
      resolve(dialog.returnValue === 'confirm');
    }, { once: true });
    dialog.showModal();
  });
}

function hasProgress() { return game && !game.won && game.board.some((n, i) => n !== game.givens[i]); }

async function startGame(nextDifficulty = difficulty, saved = null) {
  if (!DIFFICULTIES.includes(nextDifficulty) || busy) return;
  const oldGame = game;
  const oldDifficulty = difficulty;
  const id = ++requestId;
  stopClock();
  busy = true;
  updateControls();
  showOverlay('A moment of focus.', 'Connecting to your Java solver…');
  try {
    const puzzle = saved?.puzzle || randomPuzzle(nextDifficulty, game?.file);
    const originalSolution = await fetchSolution(puzzle);
    if (id !== requestId) return;
    const digits = saved?.digits || shuffledDigits();
    const givens = mappedGrid(puzzle, digits);
    const solution = verifySolution(originalSolution.map(n => digits[n]), givens);
    game = {
      file: puzzle.file, digits, givens, solution,
      board: saved ? [...saved.board] : [...givens],
      selected: saved?.selected ?? givens.findIndex(n => n === 0),
      elapsed: saved?.elapsed || 0, startedAt: null, hints: saved?.hints || 0,
      paused: false, won: false, savedBoard: saved ? JSON.stringify(saved.board) : null,
    };
    difficulty = nextDifficulty;
    revealedErrors.clear();
    hideOverlay();
    if (isComplete(game.board)) finish();
    else if (document.hidden) pause();
    else game.startedAt = performance.now();
    if (!game.won) status(saved ? 'Saved game restored. Pick up where you left off.' : 'Select an empty square, then choose a number. You have time.');
  } catch (error) {
    game = oldGame;
    difficulty = oldDifficulty;
    if (game && !game.won) game.paused = true;
    const message = error.name === 'TimeoutError' ? 'The solver took too long to respond. Please try again.' : error.message;
    status(message, 'error');
    showOverlay('Let’s reconnect.', message, game ? 'Return to game' : 'Try again', () => {
      if (game) { game.won ? finish() : pause(); render(); }
      else startGame(nextDifficulty, saved);
    });
  } finally {
    busy = false;
    render();
  }
}

function select(index, focus = false) {
  if (!editable()) return;
  game.selected = index;
  render();
  if (focus) cells[index].focus({ preventScroll: true });
}

function enter(value) {
  if (!editable() || !Number.isInteger(value) || value < 0 || value > 9) return;
  const index = game.selected;
  if (game.givens[index]) { status('This is an original clue. Choose an empty or editable square.'); return; }
  game.board[index] = value;
  revealedErrors.delete(index);
  const duplicateCells = conflicts(game.board);
  status(duplicateCells.size ? 'A number repeats in a row, column, or box. Highlighted squares need another look.' : value ? 'One square closer. Keep going.' : 'Square cleared.', duplicateCells.size ? 'error' : '');
  if (isComplete(game.board)) finish();
  render();
}

function finish() {
  stopClock();
  game.won = true;
  game.paused = false;
  showOverlay('Beautifully solved.', `${difficulty[0].toUpperCase() + difficulty.slice(1)} completed in ${formatTime(game.elapsed)} with ${game.hints} hint${game.hints === 1 ? '' : 's'}. A little focus goes a long way.`, 'Play another', () => startGame());
  $('board-wrap').classList.remove('win');
  requestAnimationFrame(() => $('board-wrap').classList.add('win'));
  status('Congratulations! Every number is in its place.', 'success');
}

function hint() {
  if (!editable()) return;
  let index = game.selected;
  if (game.givens[index] || game.board[index] === game.solution[index]) {
    index = game.board.findIndex((n, i) => !game.givens[i] && n !== game.solution[i]);
  }
  if (index < 0) return;
  game.selected = index;
  game.hints++;
  enter(game.solution[index]);
  if (!game.won) status(`Hint placed in row ${Math.floor(index / 9) + 1}, column ${index % 9 + 1}.`, 'success');
}

function check() {
  if (!editable()) return;
  revealedErrors = new Set(game.board.flatMap((n, i) => n && n !== game.solution[i] ? [i] : []));
  const empty = game.board.filter(n => !n).length;
  if (isComplete(game.board)) finish();
  else if (revealedErrors.size) status(`${revealedErrors.size} entr${revealedErrors.size === 1 ? 'y needs' : 'ies need'} another look. They’re highlighted on the board.`, 'error');
  else status(`All your entries are correct so far. ${empty} square${empty === 1 ? '' : 's'} to go.`, 'success');
  render();
}

function pause() {
  if (!game || game.won) return;
  stopClock();
  game.paused = true;
  showOverlay('Take a breath.', 'Your timer is paused. Come back when you’re ready.', 'Resume session', resume);
  render();
}

function resume() {
  if (!game || busy || game.won) return;
  game.paused = false;
  game.startedAt = performance.now();
  hideOverlay();
  render();
  cells[game.selected].focus({ preventScroll: true });
}

function save() {
  if (!game || busy) return;
  try {
    const savedAt = new Date().toISOString();
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, file: game.file, difficulty,
      digits: game.digits, board: game.board, selected: game.selected, hints: game.hints, elapsed: elapsed(), savedAt }));
    game.savedBoard = JSON.stringify(game.board);
    $('save-note').textContent = `Saved at ${new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · in this browser`;
    status('Game saved. Use Load saved game to continue, even after closing this page.', 'success');
  } catch { status('Your browser could not save this game. Check that local storage is enabled and has space.', 'error'); }
}

async function load() {
  if (busy) return;
  let saved;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) { status('No saved game yet. Use Save game to keep your progress.'); return; }
    saved = validateSave(JSON.parse(raw));
  } catch (error) { status(error instanceof SyntaxError ? 'The saved game is damaged. Your current game has been kept.' : error.message, 'error'); return; }
  if (hasProgress() && !await confirmReplace('Load your saved session?', 'This will replace the current board. Your saved game will stay available.')) return;
  await startGame(saved.difficulty, saved);
}

async function requestNew(nextDifficulty = difficulty) {
  if (busy || !DIFFICULTIES.includes(nextDifficulty)) return;
  if (hasProgress() && !await confirmReplace('Start a new session?', 'Your current board will be replaced. Only progress saved with Save game can be loaded later.')) return;
  await startGame(nextDifficulty);
}

for (let index = 0; index < 81; index++) {
  const cell = document.createElement('button');
  cell.type = 'button';
  cell.className = 'cell';
  cell.tabIndex = -1;
  cell.addEventListener('click', () => select(index));
  cells.push(cell);
  $('board').append(cell);
}
for (let n = 1; n <= 9; n++) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = n;
  button.setAttribute('aria-label', `Enter ${n}`);
  button.addEventListener('click', () => enter(n));
  numberButtons.push(button);
  $('number-pad').append(button);
}

$('board').addEventListener('keydown', event => {
  if (!editable() || event.ctrlKey || event.metaKey || event.altKey) return;
  const index = game.selected;
  const row = Math.floor(index / 9), col = index % 9;
  const destinations = { ArrowUp: Math.max(0, row - 1) * 9 + col, ArrowDown: Math.min(8, row + 1) * 9 + col,
    ArrowLeft: row * 9 + Math.max(0, col - 1), ArrowRight: row * 9 + Math.min(8, col + 1), Home: row * 9, End: row * 9 + 8 };
  if (Object.hasOwn(destinations, event.key)) { event.preventDefault(); select(destinations[event.key], true); }
  else if (/^[1-9]$/.test(event.key)) { event.preventDefault(); enter(Number(event.key)); }
  else if (['Backspace', 'Delete', '0'].includes(event.key)) { event.preventDefault(); enter(0); }
});
$('erase').addEventListener('click', () => enter(0));
$('hint').addEventListener('click', hint);
$('check').addEventListener('click', check);
$('new-game').addEventListener('click', () => requestNew());
$('pause').addEventListener('click', () => game?.paused ? resume() : pause());
$('save').addEventListener('click', save);
$('load').addEventListener('click', load);
$('overlay-action').addEventListener('click', () => overlayAction?.());
for (const button of document.querySelectorAll('[data-difficulty]')) {
  button.addEventListener('click', () => { if (button.dataset.difficulty !== difficulty) requestNew(button.dataset.difficulty); });
}
document.addEventListener('visibilitychange', () => { if (document.hidden && editable()) pause(); });
window.addEventListener('beforeunload', event => {
  if (hasProgress() && JSON.stringify(game.board) !== game.savedBoard) {
    event.preventDefault();
    event.returnValue = '';
  }
});
setInterval(() => { if (game) $('timer').textContent = formatTime(elapsed()); }, 250);
startGame();
