const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

for (const width of [360, 390, 768, 1440]) test(`dense financial trackers with long content at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore with demo data', exact: true }).click();
  await page.evaluate(() => {
    const key = (feature) => `@pocketwise/v2/demo/${feature}/snapshot`;
    const title = (index) => `Student record ${index}: long accommodation and university costs for review`;
    const budget = JSON.parse(localStorage.getItem(key('budget')));
    if (!budget) throw new Error('Budget demo fixture not initialized');
    budget.bills = Array.from({ length: 30 }, (_, i) => ({ ...budget.bills[1], id: `dense-bill-${i}`, title: title(i), amount: 999.99 }));
    budget.profile.school = 'A university name long enough to exercise wrapping in the profile identity';
    localStorage.setItem(key('budget'), JSON.stringify(budget));
    for (const [feature, field] of [['goals', 'name'], ['subscriptions', 'name'], ['splits', 'title']]) {
      const rows = JSON.parse(localStorage.getItem(key(feature)));
      if (!rows?.length) throw new Error(`${feature} demo fixture not initialized`);
      localStorage.setItem(key(feature), JSON.stringify(Array.from({ length: 30 }, (_, i) => ({ ...rows[0], id: `dense-${feature}-${i}`, [field]: title(i) }))));
    }
  });
  await page.reload();
  await page.getByRole('button', { name: 'Explore with demo data', exact: true }).click();
  await page.addStyleTag({ content: '[dir="auto"],input { font-size:24px!important; line-height:1.4!important; }' });
  await page.getByRole('tab', { name: /Budgets/ }).click();
  const check = async (feature) => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/dense-${feature}-${width}.png` });
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
  };
  await page.getByRole('checkbox', { name: /Student record 29:/ }).scrollIntoViewIfNeeded();
  await check('bills');
  for (const [feature, label] of [['goals', 'Savings goals'], ['subscriptions', 'Subscriptions'], ['debts', 'Split costs']]) {
    await page.getByRole('tab', { name: /Profile/ }).click();
    await page.getByText(label, { exact: true }).first().click();
    const last = page.getByRole('button', { name: feature === 'goals' ? /Manage savings goal Student record 29:/ : /^Student record 29:/ }).first();
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeVisible();
    await check(feature);
    await page.getByRole('button', { name: 'Back', exact: true }).click();
  }
});
