/**
 * Minesweeper solver using Playwright.
 *
 * Strategy (in order of preference):
 *  1. Constraint propagation  – number - flagged_neighbours = remaining mines
 *     a. If remaining == 0           → all hidden neighbours are SAFE
 *     b. If remaining == hidden count → all hidden neighbours are MINES
 *  2. Subset elimination – if constraint A ⊆ constraint B then (B\A) has
 *     (countB - countA) mines.  Iterate until stable.
 *  3. Probabilistic guess – when no certain move exists, pick the hidden
 *     border cell with the most revealed neighbours (most information, so
 *     statistically the lowest mine density given the local context).
 */

import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const SHOTS = resolve(__dir, '../game-screenshots');
const URL = process.env.GAME_URL ?? 'http://localhost:5173/minesweeper/';

// ─── board helpers ────────────────────────────────────────────────────────────

const idx = (cols, r, c) => r * cols + c;
const key = (r, c) => `${r},${c}`;
const parseKey = (k) => k.split(',').map(Number);

function neighbours(board, rows, cols, r, c) {
  const ns = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols)
        ns.push(board[idx(cols, nr, nc)]);
    }
  return ns;
}

// ─── solver ───────────────────────────────────────────────────────────────────

function solve(board, rows, cols) {
  const safe = new Set();
  const mines = new Set();

  // Build one constraint per revealed numbered cell
  const constraints = [];
  for (const cell of board) {
    if (cell.state !== 'revealed' || cell.neighborCount === 0) continue;
    const ns = neighbours(board, rows, cols, cell.row, cell.col);
    const hidden = ns.filter((n) => n.state === 'hidden').map((n) => key(n.row, n.col));
    const flagged = ns.filter((n) => n.state === 'flagged').length;
    const remaining = cell.neighborCount - flagged;
    if (hidden.length === 0) continue;
    if (remaining === 0) hidden.forEach((k) => safe.add(k));
    else if (remaining === hidden.length) hidden.forEach((k) => mines.add(k));
    else constraints.push({ cells: hidden, count: remaining });
  }

  // Subset elimination – repeat until no new information
  let changed = true;
  while (changed) {
    changed = false;
    for (const a of constraints) {
      for (const b of constraints) {
        if (a === b || a.cells.length >= b.cells.length) continue;
        const aSet = new Set(a.cells);
        if (!a.cells.every((k) => b.cells.includes(k))) continue; // a ⊄ b
        const diff = b.cells.filter((k) => !aSet.has(k));
        const diffCount = b.count - a.count;
        if (diffCount === 0) diff.forEach((k) => { if (!safe.has(k)) { safe.add(k); changed = true; } });
        else if (diffCount === diff.length) diff.forEach((k) => { if (!mines.has(k)) { mines.add(k); changed = true; } });
      }
    }
  }

  return { safe, mines };
}

// Pick the hidden cell with the most revealed neighbours (border cell with
// maximum available information → statistically safest guess).
function bestGuess(board, rows, cols) {
  let best = null, bestScore = -Infinity;
  for (const cell of board) {
    if (cell.state !== 'hidden') continue;
    const ns = neighbours(board, rows, cols, cell.row, cell.col);
    const score = ns.filter((n) => n.state === 'revealed').length
                - ns.filter((n) => n.state === 'flagged').length * 2;
    if (score > bestScore) { bestScore = score; best = cell; }
  }
  return best;
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(SHOTS, { recursive: true });

  const DIFFICULTY = process.env.DIFFICULTY ?? 'beginner';
  const centres    = { beginner: [4, 4], intermediate: [8, 8], expert: [8, 15] };
  const viewports  = { beginner: [680, 540], intermediate: [780, 780], expert: [1200, 780] };
  const [startR, startC] = centres[DIFFICULTY] ?? [4, 4];
  const [vpW, vpH] = viewports[DIFFICULTY] ?? [680, 540];

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: vpW, height: vpH });

  const sel = (r, c) => `[aria-label="Cell ${r},${c}"]`;
  const state = () => page.evaluate(() => window.__gameState);

  let n = 0;
  const shots = [];
  const snap = async (label) => {
    const file = `${SHOTS}/${String(n).padStart(2, '0')}-${label}.png`;
    await page.screenshot({ path: file });
    shots.push(file);
    n++;
    return file;
  };

  // ── load ──
  await page.goto(URL);
  await page.waitForLoadState('networkidle');

  if (DIFFICULTY !== 'beginner') {
    const label = DIFFICULTY[0].toUpperCase() + DIFFICULTY.slice(1);
    await page.getByRole('button', { name: label }).click();
    await page.waitForFunction(
      (d) => window.__gameState?.difficulty?.key === d,
      DIFFICULTY,
    );
  }
  await snap('initial');

  // ── first click: centre cell maximises flood-fill potential ──
  await page.locator(sel(startR, startC)).click();
  await page.waitForFunction(() => window.__gameState?.status === 'playing');
  await snap('after-first-click');

  let guesses = 0;
  let moves = 1;

  // ── main loop ──
  for (let iter = 0; iter < 500; iter++) {
    const s = await state();
    if (!s || s.status !== 'playing') break;

    const { board, difficulty: { rows, cols } } = s;
    const { safe, mines } = solve(board, rows, cols);

    // 1. Flag mines
    let flagged = 0;
    for (const k of mines) {
      const [r, c] = parseKey(k);
      if (board[idx(cols, r, c)].state === 'hidden') {
        await page.locator(sel(r, c)).click({ button: 'right' });
        flagged++;
      }
    }
    if (flagged) {
      moves += flagged;
      await snap(`flagged`);
      continue;
    }

    // 2. Reveal safe cells
    let revealed = 0;
    for (const k of safe) {
      const [r, c] = parseKey(k);
      if (board[idx(cols, r, c)].state === 'hidden') {
        await page.locator(sel(r, c)).click();
        revealed++;
        moves++;
      }
    }
    if (revealed) {
      const ns = await state();
      if (ns?.status !== 'playing') break;
      await snap(`revealed`);
      continue;
    }

    // 3. Guess
    const target = bestGuess(board, rows, cols);
    if (!target) break;
    guesses++;
    moves++;
    await page.locator(sel(target.row, target.col)).click();
    await page.waitForTimeout(80);
    const ns = await state();
    await snap(`guess-${guesses}`);
    if (ns?.status !== 'playing') break;
  }

  const final = await state();
  await snap(`final-${final?.status}`);

  await browser.close();

  // Print summary for the calling process to read
  console.log(JSON.stringify({ result: final?.status, moves, guesses, shots }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
