import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PUZZLES, mappedGrid, shuffledDigits } from '../../main/resources/static/js/puzzles.js';
import { conflicts, peers, validBoard, isComplete, parseSolution, verifySolution, validateSave, formatTime } from '../../main/resources/static/js/game.js';

// Independent MRV solver: count up to two solutions to detect ambiguous fixtures.
function solutions(input) {
  const board = [...input];
  const found = [];
  function visit() {
    if (found.length >= 2) return;
    let cell = -1, choices = [];
    for (let i = 0; i < 81; i++) {
      if (board[i]) continue;
      const options = Array.from({ length: 9 }, (_, n) => n + 1).filter(n => !board.some((v, j) => v === n && peers(i, j)));
      if (!options.length) return;
      if (cell < 0 || options.length < choices.length) { cell = i; choices = options; }
    }
    if (cell < 0) { found.push([...board]); return; }
    for (const n of choices) { board[cell] = n; visit(); }
    board[cell] = 0;
  }
  visit();
  return found;
}

for (const puzzle of PUZZLES) {
  test(`${puzzle.file}: catalogue matches file, valid clues, unique solution`, () => {
    const original = readFileSync(new URL(`../../main/resources/puzzles/${puzzle.file}`, import.meta.url), 'utf8').trim().split(/\s+/).map(Number);
    assert.deepEqual([...puzzle.grid].map(Number), original);
    assert.equal(conflicts(original).size, 0);
    const solved = solutions(original);
    assert.equal(solved.length, 1, 'puzzle must have exactly one solution');
    assert.ok(isComplete(solved[0]));
    const savedSolution = readFileSync(new URL(`../../main/resources/puzzles/${puzzle.file.replace('.txt', '.solution.txt')}`, import.meta.url), 'utf8').trim().split(/\s+/).map(Number);
    assert.deepEqual(solved[0], savedSolution);
  });
}

const puzzle = PUZZLES[0];
const givens = [...puzzle.grid].map(Number);
const solution = solutions(givens)[0];
const textResponse = 'Puzzle solved\n\n' + Array.from({ length: 9 }, (_, r) => solution.slice(r * 9, r * 9 + 9).join(' ') + ' ').join('\n');

test('parses actual controller format and rejects malformed or inconsistent responses', () => {
  assert.deepEqual(parseSolution(textResponse, givens), solution);
  assert.throws(() => parseSolution('No solution found', givens));
  assert.throws(() => parseSolution(textResponse.replace(/\d/, '0'), givens));
  assert.throws(() => verifySolution(solution, Array(81).fill(1)));
});

test('detects row, column, and box conflicts; rejects invalid and incomplete boards', () => {
  for (const [a, b] of [[0, 8], [0, 72], [0, 10]]) {
    const board = Array(81).fill(0); board[a] = board[b] = 5;
    assert.deepEqual([...conflicts(board)], [a, b]);
  }
  assert.equal(peers(0, 40), false);
  assert.equal(peers(0, 0), false);
  assert.equal(isComplete(givens), false);
  assert.equal(validBoard(Array(81).fill('1')), false);
  assert.equal(validBoard(Array(80).fill(0)), false);
  assert.equal(validBoard(Array(81).fill(10)), false);
  assert.equal(isComplete(Array(81).fill(1)), false);
});

test('digit variations preserve clues and Sudoku rules', () => {
  for (let i = 0; i < 30; i++) {
    const digits = shuffledDigits();
    assert.equal(new Set(digits).size, 10);
    assert.doesNotThrow(() => verifySolution(solution.map(n => digits[n]), mappedGrid(puzzle, digits)));
  }
});

test('save validation accepts progress and rejects tampering, invalid types, and damaged data', () => {
  const save = { version: 1, file: puzzle.file, difficulty: puzzle.difficulty, digits: [0,1,2,3,4,5,6,7,8,9], board: givens, elapsed: 12345, hints: 2, selected: 0, savedAt: new Date().toISOString() };
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(save))).givens, givens);
  for (const patch of [{ version: 2 }, { file: '../puzzle.txt' }, { difficulty: 'hard' }, { digits: Array(10).fill(1) }, { elapsed: -1 }, { hints: 0.5 }, { board: Array(81).fill(0) }, { selected: 81 }, { savedAt: 'bad' }]) {
    assert.throws(() => validateSave({ ...save, ...patch }));
  }
});

test('timer supports minutes and hours', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(61000), '01:01');
  assert.equal(formatTime(3661000), '1:01:01');
});

if (process.env.SUDOKU_API_TEST === '1') {
  for (const p of PUZZLES) test(`live API solves ${p.file}`, async () => {
    const response = await fetch(`http://localhost:8081/sudoku/solve?file=${p.file}`);
    assert.equal(response.status, 200);
    assert.ok(isComplete(parseSolution(await response.text(), [...p.grid].map(Number))));
  });
}
