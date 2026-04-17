// Test script for zh_TW Traditional Chinese translations on Odoo
// Launches its own headless browser

const { chromium } = require('playwright');

const ODOO_URL = 'http://localhost:9092';
const SCREENSHOTS_DIR = '/var/tmp/vibe-kanban/worktrees/7174-github/Woow_odoo_acconting_enhance/test_screenshots';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function safeGoto(page, url) {
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await sleep(5000);
}

async function rpc(page, model, method, args, kwargs) {
  return page.evaluate(async ({ model, method, args, kwargs }) => {
    const response = await fetch(`/web/dataset/call_kw/${model}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Math.floor(Math.random() * 100000),
        method: 'call',
        params: { model, method, args, kwargs: kwargs || {} }
      })
    });
    return response.json();
  }, { model, method, args, kwargs });
}

async function main() {
  console.log('Launching headless browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // Step 1: Login
  console.log('\n=== Step 1: Login to Odoo ===');
  await safeGoto(page, `${ODOO_URL}/web/login`);
  console.log(`Login page loaded. Title: ${await page.title()}`);

  await page.fill('input[name="login"]', 'admin');
  await page.fill('input[name="password"]', 'admin');
  await page.click('button[type="submit"]');
  await sleep(5000);
  console.log(`Logged in. URL: ${page.url()}, Title: ${await page.title()}`);

  // Step 2: Install zh_TW language
  console.log('\n=== Step 2: Install Traditional Chinese (zh_TW) ===');

  const langCheck = await rpc(page, 'res.lang', 'search_read',
    [[['code', '=', 'zh_TW']]], { fields: ['name', 'code', 'active'] });
  console.log('Existing zh_TW:', JSON.stringify(langCheck.result));

  let langInstalled = langCheck.result && langCheck.result.length > 0 && langCheck.result[0].active;

  if (!langInstalled) {
    console.log('zh_TW not active. Searching for inactive record...');
    const inactiveLangs = await page.evaluate(async () => {
      const resp = await fetch('/web/dataset/call_kw/res.lang/search_read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method: 'call',
          params: {
            model: 'res.lang', method: 'search_read',
            args: [[['code', '=', 'zh_TW']]],
            kwargs: { fields: ['id', 'name', 'code', 'active'], context: { active_test: false } }
          }
        })
      });
      return resp.json();
    });
    console.log('zh_TW (inactive):', JSON.stringify(inactiveLangs.result));

    if (inactiveLangs.result && inactiveLangs.result.length > 0) {
      const langId = inactiveLangs.result[0].id;
      console.log(`Found zh_TW with ID ${langId}. Installing...`);

      const installResult = await page.evaluate(async (langId) => {
        // Create wizard
        const createResp = await fetch('/web/dataset/call_kw/base.language.install/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 1, method: 'call',
            params: {
              model: 'base.language.install', method: 'create',
              args: [{ lang_ids: [[6, 0, [langId]]] }], kwargs: {}
            }
          })
        });
        const createData = await createResp.json();
        if (createData.error) return { error: createData.error.data.message };
        const wizardId = createData.result;

        // Execute install
        const installResp = await fetch('/web/dataset/call_kw/base.language.install/lang_install', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 2, method: 'call',
            params: {
              model: 'base.language.install', method: 'lang_install',
              args: [[wizardId]], kwargs: {}
            }
          })
        });
        const installData = await installResp.json();
        if (installData.error) return { error: installData.error.data.message };
        return { success: true, wizardId };
      }, inactiveLangs.result[0].id);

      console.log('Install result:', JSON.stringify(installResult));
    }

    // Verify
    const verify = await rpc(page, 'res.lang', 'search_read',
      [[['code', '=', 'zh_TW']]], { fields: ['name', 'code', 'active'] });
    console.log('Verification:', JSON.stringify(verify.result));
    langInstalled = verify.result && verify.result.length > 0 && verify.result[0].active;
  }

  console.log(`zh_TW installed: ${langInstalled ? 'YES' : 'NO'}`);

  // Screenshot settings page
  await safeGoto(page, `${ODOO_URL}/odoo/settings`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01_settings_page.png`, fullPage: false });
  console.log('Screenshot: 01_settings_page.png');

  // Step 3: Change admin language to zh_TW
  console.log('\n=== Step 3: Change Admin Language to zh_TW ===');
  const userResult = await rpc(page, 'res.users', 'search_read',
    [[['login', '=', 'admin']]], { fields: ['id', 'name', 'lang'], limit: 1 });
  const adminId = userResult.result[0].id;
  console.log(`Admin ID: ${adminId}, Current lang: ${userResult.result[0].lang}`);

  const writeResult = await rpc(page, 'res.users', 'write',
    [[adminId], { lang: 'zh_TW' }], {});
  console.log(`Language changed: ${writeResult.result}`);

  // Step 4: Reload and verify zh_TW translations
  console.log('\n=== Step 4: Reload and Verify zh_TW ===');
  await page.evaluate(() => {
    try { sessionStorage.clear(); } catch(e) {}
    try { localStorage.clear(); } catch(e) {}
  });
  await safeGoto(page, `${ODOO_URL}/odoo`);
  await sleep(3000);

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/02_main_page_zh_tw.png`, fullPage: false });
  console.log('Screenshot: 02_main_page_zh_tw.png');

  const pageContent = await page.textContent('body');
  const pageTitle = await page.title();
  console.log(`Page title: ${pageTitle}`);

  // Check for Traditional Chinese terms
  const traditionalTerms = ['會計', '設定', '討論', '日曆', '聯絡人', '銷售', '採購', '庫存', '發票', '資產', '應用程式'];
  const simplifiedTerms = ['会计', '讨论', '日历', '联络人', '采购', '库存', '应用程序'];

  console.log('\nTraditional Chinese terms:');
  let traditionalFound = 0;
  for (const term of traditionalTerms) {
    const found = pageContent.includes(term);
    console.log(`  ${term}: ${found ? 'FOUND' : 'not found'}`);
    if (found) traditionalFound++;
  }

  console.log('\nSimplified Chinese terms (should NOT appear):');
  let simplifiedFound = 0;
  for (const term of simplifiedTerms) {
    const found = pageContent.includes(term);
    console.log(`  ${term}: ${found ? 'FOUND (BAD!)' : 'not found (good)'}`);
    if (found) simplifiedFound++;
  }

  console.log(`\nTraditional: ${traditionalFound}/${traditionalTerms.length}, Simplified: ${simplifiedFound}/${simplifiedTerms.length}`);

  // Show all Chinese fragments
  const chineseText = pageContent.match(/[\u4e00-\u9fff]+/g);
  if (chineseText) {
    console.log(`Chinese text (first 50): ${chineseText.slice(0, 50).join(', ')}`);
  } else {
    console.log('NO Chinese text found!');
  }

  // Step 5: Settings page in zh_TW
  console.log('\n=== Step 5: Settings in zh_TW ===');
  await safeGoto(page, `${ODOO_URL}/odoo/settings`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/03_settings_zh_tw.png`, fullPage: false });
  console.log('Screenshot: 03_settings_zh_tw.png');

  const settingsContent = await page.textContent('body');
  const settingsTerms = ['設定', '使用者', '公司', '技術', '一般設定', '翻譯'];
  console.log('Settings check:');
  let settingsFound = 0;
  for (const term of settingsTerms) {
    const f = settingsContent.includes(term);
    console.log(`  ${term}: ${f ? 'FOUND' : 'not found'}`);
    if (f) settingsFound++;
  }

  // Step 6: Accounting module
  console.log('\n=== Step 6: Accounting Module in zh_TW ===');
  await safeGoto(page, `${ODOO_URL}/odoo/accounting`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/04_accounting_zh_tw.png`, fullPage: false });
  console.log('Screenshot: 04_accounting_zh_tw.png');

  const acctContent = await page.textContent('body');
  const acctTraditional = ['會計', '發票', '帳單', '日記帳', '客戶', '供應商', '銀行', '報表'];
  const acctSimplified = ['会计', '发票', '账单', '日记账', '总账'];

  let acctTradFound = 0, acctSimpFound = 0;
  console.log('\nAccounting Traditional:');
  for (const t of acctTraditional) {
    const f = acctContent.includes(t);
    console.log(`  ${t}: ${f ? 'FOUND' : 'not found'}`);
    if (f) acctTradFound++;
  }
  console.log('\nAccounting Simplified (should NOT appear):');
  for (const t of acctSimplified) {
    const f = acctContent.includes(t);
    console.log(`  ${t}: ${f ? 'FOUND (BAD!)' : 'not found (good)'}`);
    if (f) acctSimpFound++;
  }

  // Menu items
  const menus = await page.evaluate(() => {
    const els = document.querySelectorAll('.o_menu_sections a, .o_menu_sections button, .dropdown-item');
    return Array.from(els).map(e => e.textContent.trim()).filter(t => t.length > 0);
  });
  console.log('\nAccounting menus:', menus.join(' | '));

  const acctChinese = acctContent.match(/[\u4e00-\u9fff]+/g);
  if (acctChinese) {
    console.log(`Accounting Chinese (first 50): ${acctChinese.slice(0, 50).join(', ')}`);
  }

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/05_accounting_fullpage_zh_tw.png`, fullPage: true });
  console.log('Screenshot: 05_accounting_fullpage_zh_tw.png');

  // Step 7: Invoices page
  console.log('\n=== Step 7: Invoices Page ===');
  await safeGoto(page, `${ODOO_URL}/odoo/accounting/customer-invoices`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/06_invoices_zh_tw.png`, fullPage: false });
  console.log('Screenshot: 06_invoices_zh_tw.png');

  const invContent = await page.textContent('body');
  const invTerms = ['發票', '客戶', '草稿', '建立', '新增'];
  console.log('Invoices check:');
  for (const t of invTerms) {
    console.log(`  ${t}: ${invContent.includes(t) ? 'FOUND' : 'not found'}`);
  }
  const invChinese = invContent.match(/[\u4e00-\u9fff]+/g);
  if (invChinese) {
    console.log(`Invoices Chinese (first 30): ${invChinese.slice(0, 30).join(', ')}`);
  }

  // Step 8: Restore English
  console.log('\n=== Step 8: Restore English ===');
  await rpc(page, 'res.users', 'write', [[adminId], { lang: 'en_US' }], {});
  console.log('Language restored to en_US');

  await safeGoto(page, `${ODOO_URL}/odoo`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/07_restored_english.png`, fullPage: false });
  console.log('Screenshot: 07_restored_english.png');

  const enContent = await page.textContent('body');
  const hasEnglish = enContent.includes('Settings') || enContent.includes('Discuss') || enContent.includes('Accounting');
  console.log(`English restored: ${hasEnglish ? 'YES' : 'NO'}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`1. zh_TW installed/active: ${langInstalled ? 'YES' : 'NO'}`);
  console.log(`2. Traditional Chinese on main: ${traditionalFound}/${traditionalTerms.length}`);
  console.log(`3. Simplified on main (should=0): ${simplifiedFound}`);
  console.log(`4. Settings terms found: ${settingsFound}/${settingsTerms.length}`);
  console.log(`5. Traditional in Accounting: ${acctTradFound}/${acctTraditional.length}`);
  console.log(`6. Simplified in Accounting (should=0): ${acctSimpFound}`);
  console.log(`7. English restored: ${hasEnglish ? 'YES' : 'NO'}`);

  const passed = langInstalled && traditionalFound > 0 && simplifiedFound === 0 && acctSimpFound === 0 && hasEnglish;
  console.log(`\nRESULT: ${passed ? 'PASSED' : 'NEEDS REVIEW'}`);
  if (!passed) {
    if (!langInstalled) console.log('  - zh_TW not installed');
    if (traditionalFound === 0) console.log('  - No Traditional Chinese found on main page');
    if (simplifiedFound > 0) console.log('  - Simplified Chinese detected (wrong variant)');
    if (acctSimpFound > 0) console.log('  - Simplified Chinese in Accounting');
    if (!hasEnglish) console.log('  - Could not restore English');
  }
  console.log('='.repeat(60));
  console.log(`Screenshots: ${SCREENSHOTS_DIR}/`);

  await browser.close();
}

main().catch(err => {
  console.error('ERROR:', err.message || err);
  process.exit(1);
});
