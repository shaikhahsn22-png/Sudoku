// Mirrors the existing resource files. The Java API remains the source of solutions.
export const PUZZLES = [
  { file: 'puzzle2.txt', difficulty: 'easy', grid: '021000543060510872870402061004283010000645309608971005309027106250194738100050090' },
  { file: 'puzzle1.txt', difficulty: 'medium', grid: '000150070106000820300860040900400567004708300732006004040081009017000208050037000' },
  { file: 'puzzle4.txt', difficulty: 'medium', grid: '530070000600195000098000060800060003400803001700020006060000280000419005000080079' },
  { file: 'puzzle3.txt', difficulty: 'hard', grid: '000708000060009800000430000000000600010005089038000400340807106056090730100050090' },
];

export const DIFFICULTIES = ['easy', 'medium', 'hard'];
export const SAVE_KEY = 'sudoku-studio.save.v1';

export function randomPuzzle(difficulty, previousFile) {
  const candidates = PUZZLES.filter(p => p.difficulty === difficulty);
  const alternatives = candidates.filter(p => p.file !== previousFile);
  const pool = alternatives.length ? alternatives : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function shuffledDigits() {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return [0, ...digits];
}

export function mappedGrid(puzzle, digits) {
  return [...puzzle.grid].map(n => digits[Number(n)]);
}
