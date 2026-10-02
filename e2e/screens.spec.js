const { test, expect } = require('@playwright/test');

for (const width of [360,390,768,1440]) test(`screen inspection at ${width}px`, async ({ page }) => {
  await page.setViewportSize({width,height:900});
  const errors=[]; page.on('pageerror',(error)=>errors.push(error.message));
  const capture=async (name) => {
    await expect(page.getByText('Pocketwise could not display this screen.',{exact:true})).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({path:`test-results/screens-${width}/${name}.png`});
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
    await back();
  }
  await page.getByRole('tab',{name:/Budgets/}).click();
  await page.getByRole('button',{name:'Add bill',exact:true}).first().click(); await capture('bill-form'); await back();
  await page.getByRole('button',{name:'Edit Phone plan',exact:true}).click(); await capture('bill-management'); await back();
  expect(errors).toEqual([]);
});

test('10,000 transactions: browser loading and virtualized Activity rendering', async ({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Explore with demo data',exact:true}).click();
  await page.getByRole('tab',{name:/Profile/}).click();
  await page.getByText('Privacy & data',{exact:true}).click();
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export JSON',exact:true}).click();
  const stream=await (await downloadPromise).createReadStream();
  const chunks=[]; for await(const chunk of stream) chunks.push(chunk);
  const snapshot=JSON.parse(Buffer.concat(chunks).toString());
  const date=new Date().toISOString();
  snapshot.transactions=Array.from({length:10000},(_,id)=>({id:`synthetic-${id}`,type:'expense',amount:0.1,category:'food',title:`Synthetic transaction ${id}`,date}));
  await page.evaluate((data)=>localStorage.setItem('@pocketwise/v2/demo/budget/snapshot',JSON.stringify(data)),snapshot);
  let cloudRequests=0;
  page.on('request',(request)=>{ if(/supabase/.test(request.url())) cloudRequests++; });
  await page.reload();
  const started=Date.now();
  await page.getByRole('button',{name:'Explore with demo data',exact:true}).click();
  await expect(page.getByText('BUDGET AFTER COMMITMENTS',{exact:true})).toBeVisible();
  const homeMs=Date.now()-started;
  const activityStarted=Date.now(); await page.getByRole('tab',{name:/Activity/}).click();
  await expect(page.getByRole('button',{name:/^Synthetic transaction 0,/}).first()).toBeVisible();
  const activityMs=Date.now()-activityStarted;
  const renderedRows=await page.getByRole('button',{name:/Synthetic transaction/}).count();
  expect(renderedRows).toBeLessThan(1000);
  expect(cloudRequests).toBe(0);
  await page.screenshot({path:'test-results/transactions-10000.png'});
  const result=JSON.stringify({records:10000,homeMs,activityMs,renderedRows,cloudRequests,browser:await page.context().browser().version(),environment:'Headless Edge/Chromium, local production web export, synthetic demo data. No native device or real network timings.'},null,2);
  require('node:fs').writeFileSync('test-results/browser-performance.json',result+'\n');
  await test.info().attach('browser-performance',{body:Buffer.from(result),contentType:'application/json'});
});
