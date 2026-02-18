import { test, expect } from '@playwright/test';

const APP_URL = '/minesweeper/';

function cellSelector(row: number, col: number) {
  return `[aria-label="Cell ${row},${col}"]`;
}

test.describe('Minesweeper', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
  });

  test('page loads with 81 cells, smiley, and reset button', async ({ page }) => {
    const cells = page.locator('[aria-label^="Cell "]');
    await expect(cells).toHaveCount(81);
    const resetBtn = page.getByRole('button', { name: 'Reset game' });
    await expect(resetBtn).toBeVisible();
    await expect(resetBtn).toContainText('🙂');
  });

  test('first-click safety: center cell never triggers loss', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      if (i > 0) await page.goto(APP_URL);
      await page.locator(cellSelector(4, 4)).click();
      const resetBtn = page.getByRole('button', { name: 'Reset game' });
      await expect(resetBtn).not.toContainText('😵');
    }
  });

  test('left click reveals cell and enters playing state', async ({ page }) => {
    await page.locator(cellSelector(4, 4)).click();
    await page.waitForFunction(() => (window as Record<string, unknown>).__gameState !== undefined);
    const state = await page.evaluate(() => (window as Record<string, unknown>).__gameState);
    expect((state as { status: string }).status).toBe('playing');
  });

  test('right click flags a hidden cell', async ({ page }) => {
    await page.locator(cellSelector(4, 4)).click();
    await page.waitForFunction(() => (window as Record<string, unknown>).__gameState !== undefined);

    const hidden = await page.evaluate(() => {
      const state = (window as Record<string, unknown>).__gameState as {
        board: Array<{ row: number; col: number; state: string }>;
      };
      return state.board.find((c) => c.state === 'hidden') ?? null;
    });

    expect(hidden).not.toBeNull();
    await page.locator(cellSelector(hidden!.row, hidden!.col)).click({ button: 'right' });
    await expect(page.locator(cellSelector(hidden!.row, hidden!.col))).toContainText('🚩');
  });

  test('right click again unflags a cell', async ({ page }) => {
    await page.locator(cellSelector(4, 4)).click();
    await page.waitForFunction(() => (window as Record<string, unknown>).__gameState !== undefined);

    const hidden = await page.evaluate(() => {
      const state = (window as Record<string, unknown>).__gameState as {
        board: Array<{ row: number; col: number; state: string }>;
      };
      return state.board.find((c) => c.state === 'hidden') ?? null;
    });

    expect(hidden).not.toBeNull();
    const sel = cellSelector(hidden!.row, hidden!.col);
    await page.locator(sel).click({ button: 'right' });
    await expect(page.locator(sel)).toContainText('🚩');
    await page.locator(sel).click({ button: 'right' });
    await expect(page.locator(sel)).not.toContainText('🚩');
  });

  test('reset button returns to idle with 81 cells', async ({ page }) => {
    await page.locator(cellSelector(4, 4)).click();
    await page.getByRole('button', { name: 'Reset game' }).click();
    await expect(page.locator('[aria-label^="Cell "]')).toHaveCount(81);
    const state = await page.evaluate(() => (window as Record<string, unknown>).__gameState);
    expect((state as { status: string }).status).toBe('idle');
  });

  test('difficulty Intermediate → 256 cells', async ({ page }) => {
    await page.getByRole('button', { name: 'Intermediate' }).click();
    await expect(page.locator('[aria-label^="Cell "]')).toHaveCount(256);
  });

  test('difficulty Expert → 480 cells', async ({ page }) => {
    await page.getByRole('button', { name: 'Expert' }).click();
    await expect(page.locator('[aria-label^="Cell "]')).toHaveCount(480);
  });

  test('difficulty back to Beginner → 81 cells', async ({ page }) => {
    await page.getByRole('button', { name: 'Expert' }).click();
    await page.getByRole('button', { name: 'Beginner' }).click();
    await expect(page.locator('[aria-label^="Cell "]')).toHaveCount(81);
  });

  test('win: clicking all non-mine cells shows 😎', async ({ page }) => {
    await page.locator(cellSelector(4, 4)).click();
    await page.waitForFunction(() => (window as Record<string, unknown>).__gameState !== undefined);

    const boardData = await page.evaluate(() => {
      const state = (window as Record<string, unknown>).__gameState as {
        board: Array<{ row: number; col: number; isMine: boolean; state: string }>;
      };
      return state.board.map((c) => ({
        row: c.row,
        col: c.col,
        isMine: c.isMine,
        state: c.state,
      }));
    });

    for (const c of boardData) {
      if (!c.isMine && c.state === 'hidden') {
        await page.locator(cellSelector(c.row, c.col)).click();
        const status = await page.evaluate(() => {
          const s = (window as Record<string, unknown>).__gameState as { status: string };
          return s.status;
        });
        if (status === 'won' || status === 'lost') break;
      }
    }

    await expect(page.getByRole('button', { name: 'Reset game' })).toContainText('😎');
  });

  test('lose: clicking a mine shows 😵', async ({ page }) => {
    await page.locator(cellSelector(4, 4)).click();
    await page.waitForFunction(() => (window as Record<string, unknown>).__gameState !== undefined);

    const mine = await page.evaluate(() => {
      const state = (window as Record<string, unknown>).__gameState as {
        board: Array<{ row: number; col: number; isMine: boolean }>;
      };
      return state.board.find((c) => c.isMine) ?? null;
    });

    expect(mine).not.toBeNull();
    await page.locator(cellSelector(mine!.row, mine!.col)).click();
    await expect(page.getByRole('button', { name: 'Reset game' })).toContainText('😵');
  });

  test('middle-click chord reveals hidden unflagged neighbors', async ({ page }) => {
    await page.locator(cellSelector(4, 4)).click();
    await page.waitForFunction(() => (window as Record<string, unknown>).__gameState !== undefined);

    // Find a revealed numbered cell where all mine neighbors can be flagged
    // and at least one hidden non-mine neighbor remains
    const target = await page.evaluate(() => {
      const state = (window as Record<string, unknown>).__gameState as {
        board: Array<{
          row: number;
          col: number;
          isMine: boolean;
          neighborCount: number;
          state: string;
        }>;
        difficulty: { rows: number; cols: number };
      };
      const { board, difficulty } = state;
      const { rows, cols } = difficulty;

      function getNeighborCells(r: number, c: number) {
        const ns: typeof board = [];
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              ns.push(board[nr * cols + nc]);
            }
          }
        }
        return ns;
      }

      for (const c of board) {
        if (c.state !== 'revealed' || c.neighborCount === 0) continue;
        const ns = getNeighborCells(c.row, c.col);
        const mineNeighbors = ns.filter((n) => n.isMine);
        const hiddenNonMine = ns.filter((n) => n.state === 'hidden' && !n.isMine);
        if (mineNeighbors.length === c.neighborCount && hiddenNonMine.length > 0) {
          return {
            row: c.row,
            col: c.col,
            mineNeighbors: mineNeighbors.map((n) => ({ row: n.row, col: n.col })),
            hiddenNonMine: hiddenNonMine.map((n) => ({ row: n.row, col: n.col })),
          };
        }
      }
      return null;
    });

    if (!target) {
      test.skip();
      return;
    }

    // Flag the mine neighbors
    for (const mn of target.mineNeighbors) {
      await page.locator(cellSelector(mn.row, mn.col)).click({ button: 'right' });
    }

    // Middle-click the numbered cell to chord
    await page.locator(cellSelector(target.row, target.col)).click({ button: 'middle' });

    // Verify the first hidden non-mine neighbor is now revealed
    const firstHidden = target.hiddenNonMine[0];
    const revealedState = await page.evaluate(({ row, col }: { row: number; col: number }) => {
      const state = (window as Record<string, unknown>).__gameState as {
        board: Array<{ row: number; col: number; state: string }>;
        difficulty: { cols: number };
      };
      const { cols } = state.difficulty;
      return state.board[row * cols + col].state;
    }, firstHidden);
    expect(revealedState).toBe('revealed');
  });
});
