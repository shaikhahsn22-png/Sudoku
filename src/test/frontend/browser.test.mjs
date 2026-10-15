// Dependency-free Chrome DevTools smoke test. See SUDOKU_STUDIO.md for setup.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const endpoint = process.env.CHROME_DEBUG_URL || 'http://localhost:9222';
const target = await (await fetch(`${endpoint}/json/new?about:blank`, { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let sequence = 0;
const pending = new Map();
const exceptions = [];
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
  if (message.method === 'Page.javascriptDialogOpening') command('Page.handleJavaScriptDialog', { accept: true });
  if (message.id) {
    const entry = pending.get(message.id);
    if (!entry) return;
    clearTimeout(entry.timeout);
    pending.delete(message.id);
    message.error ? entry.reject(new Error(JSON.stringify(message.error))) : entry.resolve(message.result);
  }
};
function command(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function waitFor(expression) {
  const until = Date.now() + 12000;
  while (Date.now() < until) {
    if (await evaluate(expression)) return;
    await new Promise(r => setTimeout(r, 50));
  }
  throw new Error(`Condition not reached: ${expression}`);
}
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const ready = () => waitFor(`document.querySelectorAll('.cell').length === 81 && document.getElementById('board-overlay').hidden && !document.getElementById('new-game').disabled`);
async function reload() {
  await evaluate('window.__reloadMarker = true');
  await command('Page.reload');
  await waitFor(`!window.__reloadMarker && document.readyState === 'complete'`);
  await ready();
}
async function key(key, code = key) {
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key, code });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key, code });
}
async function confirm() {
  if (await evaluate(`document.getElementById('confirm-dialog').open`)) {
    await click('#confirm-dialog button[value="confirm"]');
    // Native dialog close events are queued for the next animation frame.
    await evaluate('new Promise(resolve => setTimeout(resolve, 100))');
  }
}
let passed = 0;
function pass(name) { passed++; console.log(`PASS ${name}`); }
async function screenshot(name) {
  const result = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(`target/frontend-tests/${name}.png`, Buffer.from(result.data, 'base64'));
}

try {
  await command('Page.enable');
  await command('Runtime.enable');
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await command('Page.navigate', { url: 'http://localhost:8081/' });
  await ready();
  await evaluate('localStorage.clear()');
  assert.equal(await evaluate(`document.title.startsWith('Sudoku Studio')`), true);
  assert.equal(await evaluate(`document.querySelectorAll('.given').length`), 50);
  assert.equal(await evaluate(`document.querySelectorAll('.cell[tabindex="0"]').length`), 1);
  pass('Spring Boot serves the full interactive board and default easy puzzle');
  mkdirSync('target/frontend-tests', { recursive: true });
  await screenshot('desktop');

  await evaluate(`window.testGiven = document.querySelector('.given'); window.testGivenValue = testGiven.textContent; testGiven.click(); testGiven.focus()`);
  await key('9', 'Digit9');
  assert.equal(await evaluate('testGiven.textContent === testGivenValue'), true);
  pass('original clues cannot be overwritten by keyboard input');

  await evaluate(`window.testEmpty = [...document.querySelectorAll('.cell')].findIndex(c => !c.textContent); document.querySelectorAll('.cell')[testEmpty].click(); document.querySelectorAll('.cell')[testEmpty].focus();`);
  await key('a', 'KeyA');
  assert.equal(await evaluate(`document.querySelectorAll('.cell')[testEmpty].textContent`), '');
  await key('5', 'Digit5');
  assert.equal(await evaluate(`document.querySelectorAll('.cell')[testEmpty].textContent`), '5');
  await key('Backspace');
  assert.equal(await evaluate(`document.querySelectorAll('.cell')[testEmpty].textContent`), '');
  await key('ArrowRight');
  assert.equal(await evaluate(`document.activeElement === document.querySelectorAll('.cell')[Math.floor(testEmpty / 9) * 9 + Math.min(8, testEmpty % 9 + 1)]`), true);
  pass('keyboard digits, invalid input, erase, and arrow navigation');

  const conflictNumber = await evaluate(`document.querySelectorAll('.cell')[testEmpty].click(); [...document.querySelectorAll('.cell')].slice(Math.floor(testEmpty / 9)*9, Math.floor(testEmpty / 9)*9+9).find(c => c.classList.contains('given')).textContent`);
  await click(`#number-pad button:nth-child(${conflictNumber})`);
  assert.equal(await evaluate(`document.querySelectorAll('.cell.conflict').length >= 2`), true);
  await click('#check');
  assert.equal(await evaluate(`document.querySelectorAll('.incorrect').length > 0`), true);
  await click('#erase');
  assert.equal(await evaluate(`document.querySelectorAll('.conflict').length`), 0);
  pass('number pad, duplicate highlighting, check feedback, and erase');

  await click('#hint');
  assert.equal(await evaluate(`document.getElementById('hint-count').textContent`), '1');
  await click('#check');
  assert.match(await evaluate(`document.getElementById('status').textContent`), /correct so far/);
  await new Promise(r => setTimeout(r, 1100));
  assert.notEqual(await evaluate(`document.getElementById('timer').textContent`), '00:00');
  await click('#pause');
  const pausedTime = await evaluate(`document.getElementById('timer').textContent`);
  await new Promise(r => setTimeout(r, 1100));
  assert.equal(await evaluate(`document.getElementById('timer').textContent`), pausedTime);
  assert.equal(await evaluate(`document.getElementById('board').inert && document.getElementById('hint').disabled`), true);
  await click('#overlay-action');
  await evaluate(`Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'))`);
  assert.equal(await evaluate(`document.getElementById('overlay-title').textContent`), 'Take a breath.');
  await evaluate(`delete document.hidden; document.dispatchEvent(new Event('visibilitychange'))`);
  assert.equal(await evaluate(`document.getElementById('board-overlay').hidden`), false);
  await click('#overlay-action');
  pass('hint returns a correct entry; timer runs, pauses, and resumes');

  await click('#save');
  const saved = await evaluate(`localStorage.getItem('sudoku-studio.save.v1')`);
  assert.ok(saved);
  await click('#new-game');
  await waitFor(`document.getElementById('confirm-dialog').open`);
  await click('#confirm-dialog button[value="cancel"]');
  await evaluate('new Promise(resolve => setTimeout(resolve, 100))');
  assert.equal(await evaluate(`document.getElementById('hint-count').textContent`), '1');
  await click('#new-game'); await confirm(); await ready();
  assert.equal(await evaluate(`document.getElementById('hint-count').textContent`), '0');
  await click('#load'); await ready();
  assert.equal(await evaluate(`JSON.stringify([...document.querySelectorAll('.cell')].map(c => Number(c.textContent))) === JSON.stringify(JSON.parse(localStorage.getItem('sudoku-studio.save.v1')).board)`), true);
  await reload();
  await click('#load'); await ready();
  assert.equal(await evaluate(`document.getElementById('hint-count').textContent`), '1');
  pass('new-game confirmation, Save/Load, and persistence across page reload');

  await evaluate(`window.savedBackup = localStorage.getItem('sudoku-studio.save.v1'); window.boardBackup = document.getElementById('board').textContent; localStorage.setItem('sudoku-studio.save.v1', '{bad')`);
  await click('#load');
  assert.match(await evaluate(`document.getElementById('status').textContent`), /damaged/);
  assert.equal(await evaluate(`document.getElementById('board').textContent === boardBackup`), true);
  await evaluate(`localStorage.setItem('sudoku-studio.save.v1', savedBackup); window.originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('blocked') }`);
  await click('#save');
  assert.match(await evaluate(`document.getElementById('status').textContent`), /could not save/);
  await evaluate(`Storage.prototype.setItem = originalSetItem`);
  pass('damaged saves and blocked storage report errors without losing the current board');

  for (const [level, expectedClues] of [['medium', [30,36]], ['hard', [29]], ['easy', [50]]]) {
    await click(`[data-difficulty="${level}"]`); await confirm(); await ready();
    assert.ok(expectedClues.includes(await evaluate(`document.querySelectorAll('.given').length`)));
    assert.equal(await evaluate(`document.querySelector('[data-difficulty="${level}"]').getAttribute('aria-pressed')`), 'true');
  }
  pass('all three difficulties select the expected existing puzzle files');

  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`), true);
  assert.equal(await evaluate(`document.querySelector('.cell').getBoundingClientRect().width >= 35`), true);
  await screenshot('mobile');
  await command('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`), true);
  pass('390px and 320px mobile layouts fit without horizontal overflow');

  await evaluate(`for (let i = 0; i < 81 && !document.getElementById('hint').disabled; i++) document.getElementById('hint').click()`);
  assert.equal(await evaluate(`document.getElementById('overlay-title').textContent`), 'Beautifully solved.');
  assert.equal(await evaluate(`document.getElementById('check').disabled`), true);
  const finishedTime = await evaluate(`document.getElementById('timer').textContent`);
  await new Promise(r => setTimeout(r, 1100));
  assert.equal(await evaluate(`document.getElementById('timer').textContent`), finishedTime);
  await screenshot('completion');
  await click('#save'); await click('#overlay-action'); await ready();
  await click('#load');
  await waitFor(`document.getElementById('overlay-title').textContent === 'Beautifully solved.'`);
  pass('winning freezes timer, announces completion, starts another game, and supports loading a completed save');

  await reload();
  await evaluate(`window.realFetch = window.fetch; window.fetch = async () => { throw new Error('Simulated offline connection') }`);
  await click('[data-difficulty="hard"]');
  await waitFor(`document.getElementById('overlay-title').textContent === 'Let’s reconnect.'`);
  assert.match(await evaluate(`document.getElementById('status').textContent`), /Simulated offline/);
  assert.equal(await evaluate(`document.getElementById('hint').disabled && document.getElementById('check').disabled`), true);
  await click('#overlay-action');
  await click('#overlay-action');
  await ready();
  await evaluate('window.fetch = realFetch');
  await click('[data-difficulty="hard"]'); await ready();
  pass('solver failures retain the previous game and allow recovery');

  await click('#load');
  await waitFor(`document.getElementById('overlay-title').textContent === 'Beautifully solved.'`);
  await evaluate(`window.fetch = async () => { throw new Error('Simulated offline connection') }`);
  await click('[data-difficulty="medium"]');
  await waitFor(`document.getElementById('overlay-title').textContent === 'Let’s reconnect.'`);
  await click('#overlay-action');
  assert.equal(await evaluate(`document.getElementById('overlay-title').textContent`), 'Beautifully solved.');
  pass('failed new game also restores the completion screen of a finished session');

  const script = await command('Page.addScriptToEvaluateOnNewDocument', { source: `window.realFetch = window.fetch; window.fetch = async () => { throw new Error('Simulated initial failure') }` });
  await evaluate('window.__reloadMarker = true');
  await command('Page.reload');
  await waitFor(`!window.__reloadMarker && document.getElementById('overlay-title')?.textContent === 'Let’s reconnect.'`);
  assert.equal(await evaluate(`document.getElementById('hint').disabled`), true);
  await command('Page.removeScriptToEvaluateOnNewDocument', { identifier: script.identifier });
  await evaluate('window.fetch = realFetch');
  await click('#overlay-action'); await ready();
  pass('initial connection failure can retry successfully without reloading');

  assert.deepEqual(exceptions, []);
  console.log(`${passed} browser scenarios passed; no uncaught JavaScript errors. Screenshots: target/frontend-tests/`);
} finally {
  await new Promise(resolve => { socket.addEventListener('close', resolve, { once: true }); socket.close(); });
  await fetch(`${endpoint}/json/close/${target.id}`);
}
