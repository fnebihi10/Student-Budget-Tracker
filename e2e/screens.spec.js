const { Buffer } = require('node:buffer');
const AxeBuilder = require('@axe-core/playwright').default;
const { test, expect } = require('@playwright/test');

for (const width of [360,390,768,1440]) test(`screen inspection at ${width}px`, async ({ page }) => {
  await page.setViewportSize({width,height:900});
  const errors=[]; page.on('pageerror',(error)=>errors.push(error.message));
  const violations = [];
  const capture=async (name) => {
    const modal = page.locator('[aria-modal="true"]:visible');
    if (await modal.count()) await expect(modal.last()).toHaveAttribute('role', 'dialog');
    await expect(page.getByText('Pocketwise could not display this screen.',{exact:true})).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({path:`test-results/screens-${width}/${name}.png`});
    const a11y = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    await test.info().attach(`a11y-${width}-${name}`, { body: JSON.stringify(a11y.violations, null, 2), contentType: 'application/json' });
    violations.push(...a11y.violations.map((violation) => ({ screen: name, ...violation })));
    require('node:fs').writeFileSync(`test-results/a11y-${width}.json`, JSON.stringify(violations, null, 2));
    const largeText = await page.addStyleTag({ content: '[dir="auto"],input { font-size:24px!important; line-height:1.4!important; }' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const clippedTabs = await page.getByRole('tab').evaluateAll((tabs) => tabs.filter((tab) => {
      const label = tab.querySelector('[dir="auto"]');
      return label && label.getBoundingClientRect().bottom > window.innerHeight;
    }).length);
    expect(clippedTabs).toBe(0);
    await page.screenshot({ path: `test-results/screens-${width}/${name}-large-text.png` });
    await largeText.evaluate((element) => element.remove());
  };
  const back=async()=>page.getByRole('button',{name:'Back',exact:true}).first().click();
  await page.goto('/'); await capture('login');
  await page.getByRole('button',{name:'Create an account',exact:true}).click(); await capture('register'); await back();
  await page.getByRole('button',{name:'Explore with demo data',exact:true}).click(); await capture('dashboard');
  await page.getByLabel('Add a transaction',{exact:true}).click();
  await page.getByLabel('Description',{exact:true}).fill('A long student expense description with a dense amount');
  await page.getByLabel('Amount',{exact:true}).fill('9999999.99');
  await capture('transaction-form'); await back();
  for (const tab of ['Activity','Budgets','Reports','Profile']) {
    await page.getByRole('tab',{name:new RegExp(tab)}).click(); await capture(tab.toLowerCase());
  }
  for (const [name,label,add] of [
    ['student-hub','Student Hub',null], ['calendar','Money calendar',null],
    ['splits','Split costs','Add personal debt'], ['coach','Smart coach',null],
    ['goals','Savings goals','Add savings goal'], ['subscriptions','Subscriptions','Add subscription'],
    ['billing-preview','Pocketwise Pro',null], ['privacy','Privacy & data',null],
  ]) {
    await page.getByText(label,{exact:true}).first().click(); await capture(name);
    if(add) { await page.getByRole('button',{name:add,exact:true}).click(); await capture(`${name}-form`); await back(); }
    if (name === 'subscriptions') { await page.getByText('Spotify Student', { exact: true }).first().click(); await capture('subscription-management'); await back(); }
    if (name === 'splits') { await page.getByText('Apartment groceries', { exact: true }).click(); await capture('debt-management'); await back(); }
    await back();
  }
  await page.getByRole('tab',{name:/Budgets/}).click();
  await page.getByRole('button',{name:'Add bill',exact:true}).first().click(); await capture('bill-form'); await back();
  await page.getByRole('button',{name:'Edit Phone plan',exact:true}).click(); await capture('bill-management'); await back();
  const food = page.getByRole('button', { name: /Food.*left/ });
  await food.click(); await capture('category-modal'); await page.keyboard.press('Escape');
  await expect(food).toBeFocused();
  await page.getByRole('tab', { name: /Profile/ }).click();
  const personal = page.getByRole('button', { name: /Personal details/ });
  await personal.click(); await capture('profile-modal');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(personal).toBeFocused();
  await page.getByText('Savings goals', { exact: true }).first().click();
  await page.getByRole('button', { name: 'Manage savings goal Emergency cushion', exact: true }).click();
  await capture('goal-management');
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click(); await capture('withdrawal-modal');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Withdraw', exact: true })).toBeFocused();
  await back(); await back();
  await page.addStyleTag({ content: '[dir="auto"],input { font-size:24px!important; line-height:1.4!important; }' });
  await capture('profile-large-text');
  expect(errors).toEqual([]);
  expect(violations).toEqual([]);
});

test('10,000 transactions: browser loading and virtualized Activity rendering', async ({page})=>{
  const coldStarted = Date.now();
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Explore with demo data', exact: true })).toBeVisible();
  const coldLoadMs = Date.now() - coldStarted;
  await page.getByRole('button',{name:'Explore with demo data',exact:true}).click();
  await page.getByRole('tab',{name:/Profile/}).click();
  await page.getByText('Privacy & data',{exact:true}).click();
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export JSON',exact:true}).click();
  const stream=await (await downloadPromise).createReadStream();
  const chunks=[]; for await(const chunk of stream) chunks.push(chunk);
  const snapshot=JSON.parse(Buffer.concat(chunks).toString());
  // Forms record date-only entries at UTC noon. Seed earlier on that civil day
  // so the measured new entry is first even when this test runs after noon.
  const date = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
  snapshot.transactions=Array.from({length:10000},(_,id)=>({id:`synthetic-${id}`,type:'expense',amount:0.1,category:'food',title:`Synthetic transaction ${id}`,recurring:false,note:"",date}));
  await page.evaluate((transactions) => {
    const key = '@pocketwise/v2/demo/budget/snapshot';
    const state = JSON.parse(localStorage.getItem(key));
    if (!state) throw new Error('Demo cache fixture was not initialized');
    localStorage.setItem(key, JSON.stringify({ ...state, transactions }));
  }, snapshot.transactions);
  let cloudRequests=0;
  page.on('request',(request)=>{ if(/supabase/.test(request.url())) cloudRequests++; });
  const refreshStarted = Date.now();
  await page.reload();
  const started=Date.now();
  await page.getByRole('button',{name:'Explore with demo data',exact:true}).click();
  await expect(page.getByText('BUDGET AFTER COMMITMENTS',{exact:true})).toBeVisible();
  const homeMs=Date.now()-started;
  const refreshMs = Date.now() - refreshStarted;
  const activityStarted=Date.now(); await page.getByRole('tab',{name:/Activity/}).click();
  await expect(page.getByRole('button',{name:/^Synthetic transaction 0,/}).first()).toBeVisible();
  const activityMs=Date.now()-activityStarted;
  const renderedRows=await page.getByRole('button',{name:/Synthetic transaction/}).count();
  expect(renderedRows).toBeLessThan(1000);
  expect(cloudRequests).toBe(0);
  await page.screenshot({path:'test-results/transactions-10000.png'});
  await page.getByRole('button', { name: 'Add a transaction', exact: true }).click();
  await page.getByLabel('Amount', { exact: true }).fill('1.23');
  await page.getByLabel('Description', { exact: true }).fill('Measured demo mutation');
  const mutationStarted = Date.now();
  await page.getByRole('button', { name: 'Save expense', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Measured demo mutation,/ })).toBeVisible();
  const mutationMs = Date.now() - mutationStarted;
  const result=JSON.stringify({recordedAt:new Date().toISOString(),records:10000,coldLoadMs,homeMs,refreshMs,mutationMs,activityMs,renderedRows,cloudRequests,browser:await page.context().browser().version(),environment:'One representative sample in headless Edge/Chromium, local production web export, synthetic demo data. Cold login includes bundle loading; refresh includes reload and 10,000-row local cache hydration; mutation includes confirmed demo storage and rendering. No native device or Supabase network timings.'},null,2);
  require('node:fs').writeFileSync('test-results/browser-performance.json',result+'\n');
  await test.info().attach('browser-performance',{body:Buffer.from(result),contentType:'application/json'});
});
