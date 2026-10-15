import { PUZZLES } from './puzzles.js';

export function peers(a, b) {
  return a !== b && (Math.floor(a / 9) === Math.floor(b / 9) || a % 9 === b % 9 ||
    (Math.floor(a / 27) === Math.floor(b / 27) && Math.floor((a % 9) / 3) === Math.floor((b % 9) / 3)));
}

export function validBoard(board, allowEmpty = true) {
  return Array.isArray(board) && board.length === 81 && board.every(n => Number.isInteger(n) && n >= (allowEmpty ? 0 : 1) && n <= 9);
}

export function conflicts(board) {
  const result = new Set();
  for (let a = 0; a < 81; a++) {
    if (!board[a]) continue;
    for (let b = a + 1; b < 81; b++) {
      if (board[a] === board[b] && peers(a, b)) { result.add(a); result.add(b); }
    }
  }
  return result;
}

export function isComplete(board) {
  return validBoard(board, false) && conflicts(board).size === 0;
}

export function verifySolution(solution, givens) {
  if (!isComplete(solution) || !validBoard(givens) || givens.some((n, i) => n && n !== solution[i])) {
    throw new Error('The solver response does not match this puzzle. Please try again.');
  }
  return solution;
}

export function parseSolution(text, givens) {
  // The existing controller returns a heading followed by nine rows of numbers.
  const rows = text.trim().split(/\r?\n/).map(row => row.trim()).filter(row => /^\d(?:\s+\d){8}$/.test(row));
  if (rows.length !== 9) throw new Error('The solver did not return a complete solution. Please try again.');
  return verifySolution(rows.flatMap(row => row.split(/\s+/).map(Number)), givens);
}

export function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  return (hours ? `${hours}:` : '') + `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function validateSave(value) {
  if (!value || value.version !== 1) throw new Error('This saved game has an unsupported format.');
  const puzzle = PUZZLES.find(p => p.file === value.file && p.difficulty === value.difficulty);
  const digits = value.digits;
  if (!puzzle || !Array.isArray(digits) || digits.length !== 10 || digits[0] !== 0 ||
      new Set(digits).size !== 10 || digits.some(n => !Number.isInteger(n) || n < 0 || n > 9)) {
    throw new Error('This saved game has invalid puzzle data.');
  }
  const givens = [...puzzle.grid].map(n => digits[Number(n)]);
  if (!validBoard(value.board) || givens.some((n, i) => n && value.board[i] !== n) ||
      !Number.isFinite(value.elapsed) || value.elapsed < 0 || value.elapsed > 31536000000 ||
      !Number.isInteger(value.hints) || value.hints < 0 || value.hints > 1000000 ||
      !Number.isInteger(value.selected) || value.selected < 0 || value.selected > 80 ||
      !Number.isFinite(Date.parse(value.savedAt))) {
    throw new Error('This saved game is damaged. Your current game has been kept.');
  }
  return { ...value, puzzle, givens };
}
