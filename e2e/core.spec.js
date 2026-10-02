const { test, expect } = require('@playwright/test');

test('env-free demo, transaction CRUD, restart, currency lock and file export', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByText('Explore with demo data', { exact: true }).click();
  await expect(page.getByText('BUDGET AFTER COMMITMENTS', { exact: true })).toBeVisible();
  await page.getByLabel('Add a transaction', { exact: true }).click();
  await page.getByLabel('Amount', { exact: true }).fill('12.34');
  await page.getByLabel('Description', { exact: true }).fill('Regression lunch');
  await page.getByRole('button', { name: 'Save expense', exact: true }).click();
  await page.getByRole('tab', { name: /Activity/ }).click();
  await expect(page.getByText('Regression lunch', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByText('Explore with demo data', { exact: true }).click();
  await page.getByRole('tab', { name: /Activity/ }).click();
  await expect(page.getByText('Regression lunch', { exact: true })).toBeVisible();
  await page.getByText('Regression lunch', { exact: true }).click();
  await page.getByLabel('Amount', { exact: true }).fill('15.55');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await page.getByText('Regression lunch', { exact: true }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete transaction', exact: true }).click();
  await expect(page.getByText('Regression lunch', { exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: /Profile/ }).click();
  await expect(page.getByRole('button', { name: 'USD', exact: true })).toBeDisabled();
  await page.getByText('Privacy & data', { exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click();
  const file = await download;
  const stream = await file.createReadStream();
  const chunks = []; for await (const chunk of stream) chunks.push(chunk);
  const json = JSON.parse(Buffer.concat(chunks).toString());
  expect(json.schemaVersion).toBe(2);
  expect(json.transactions.some((row) => row.title === 'Regression lunch')).toBe(false);
  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export transactions CSV', exact: true }).click();
  expect((await csvDownload).suggestedFilename()).toMatch(/\.csv$/);
  expect(errors).toEqual([]);
});

for (const width of [360,390,768,1440]) {
  test(`demo dashboard at ${width}px has no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByText('Explore with demo data', { exact: true }).click();
    await expect(page.getByText('BUDGET AFTER COMMITMENTS', { exact: true })).toBeVisible();
    const sizes = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
    expect(sizes.document).toBeLessThanOrEqual(sizes.viewport);
    await page.screenshot({ path: `test-results/dashboard-${width}.png`, fullPage: true });
  });
}
