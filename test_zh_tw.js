// Test script for zh_TW Traditional Chinese translations on Odoo
// Connects to existing headless Chrome via CDP

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
  console.log('Connecting to existing Chrome browser...');
  const browser = await chromium.connectOverCDP('http://localhost:35271');

  const contexts = browser.contexts();
  const context = contexts[0];
  const pages = context.pages();
  let page = pages[0];
  console.log(`Current page: ${page.url()} - "${await page.title()}"`);

  // Step 1: Verify logged in
  console.log('\n=== Step 1: Verify Login ===');
  await safeGoto(page, `${ODOO_URL}/odoo`);
  const currentUrl = page.url();
  console.log(`URL: ${currentUrl}`);

  if (currentUrl.includes('/web/login')) {
    console.log('Logging in...');
    await page.fill('input[name="login"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    await sleep(5000);
    console.log(`Logged in. URL: ${page.url()}`);
  } else {
    console.log('Already logged in.');
  }

  // Step 2: Install zh_TW language using base.language.install wizard
  console.log('\n=== Step 2: Install Traditional Chinese (zh_TW) ===');

  // Check if zh_TW is already active
  const langCheck = await rpc(page, 'res.lang', 'search_read',
    [[['code', '=', 'zh_TW']]], { fields: ['name', 'code', 'active'] });
  console.log('Existing zh_TW:', JSON.stringify(langCheck.result));

  let langInstalled = langCheck.result && langCheck.result.length > 0 && langCheck.result[0].active;

  if (!langInstalled) {
    console.log('zh_TW not active. Installing via base.language.install wizard...');

    // First, find the res.lang record for zh_TW (might be inactive)
    // In Odoo 18, we need to find the lang code and use it in the install wizard
    // The base.language.install wizard uses 'lang_ids' which are res.lang IDs

    // Let's try to find zh_TW in inactive langs
    const inactiveLangs = await page.evaluate(async () => {
      const resp = await fetch('/web/dataset/call_kw/res.lang/search_read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'call',
          params: {
            model: 'res.lang',
            method: 'search_read',
            args: [[['code', '=', 'zh_TW']]],
            kwargs: { fields: ['name', 'code', 'active'], context: { active_test: false } }
          }
        })
      });
      return resp.json();
    });
    console.log('zh_TW (including inactive):', JSON.stringify(inactiveLangs.result));

    // Use the install wizard - create it, set lang_ids, then call lang_install
    console.log('Creating install wizard and installing zh_TW...');

    const installResult = await page.evaluate(async () => {
      // Step 1: Create the wizard
      const createResp = await fetch('/web/dataset/call_kw/base.language.install/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'call',
          params: {
            model: 'base.language.install',
            method: 'create',
            args: [{}],
            kwargs: {}
          }
        })
      });
      const createData = await createResp.json();
      if (createData.error) return { step: 'create', error: createData.error.data.message };
      const wizardId = createData.result;

      // Step 2: Get the res.lang ID for zh_TW
      const langResp = await fetch('/web/dataset/call_kw/res.lang/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'call',
          params: {
            model: 'res.lang',
            method: 'search',
            args: [[['code', '=', 'zh_TW']]],
            kwargs: { context: { active_test: false } }
          }
        })
      });
      const langData = await langResp.json();
      if (langData.error) return { step: 'search_lang', error: langData.error.data.message };
      const langId = langData.result && langData.result[0];

      if (!langId) {
        return { step: 'search_lang', error: 'zh_TW lang record not found in database' };
      }

      // Step 3: Write the lang_ids to the wizard
      const writeResp = await fetch('/web/dataset/call_kw/base.language.install/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'call',
          params: {
            model: 'base.language.install',
            method: 'write',
            args: [[wizardId], { lang_ids: [[4, langId]] }],
            kwargs: {}
          }
        })
      });
      const writeData = await writeResp.json();
      if (writeData.error) return { step: 'write', error: writeData.error.data.message };

      // Step 4: Execute the install
      const installResp = await fetch('/web/dataset/call_kw/base.language.install/lang_install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 4,
          method: 'call',
          params: {
            model: 'base.language.install',
            method: 'lang_install',
            args: [[wizardId]],
            kwargs: {}
          }
        })
      });
      const installData = await installResp.json();
      if (installData.error) return { step: 'install', error: installData.error.data.message };

      return { success: true, wizardId, langId, installResult: installData.result };
    });

    console.log('Install result:', JSON.stringify(installResult, null, 2));

    if (installResult.error) {
      console.log(`Error at step "${installResult.step}": ${installResult.error}`);

      // Try alternative: navigate to settings and install through UI
      console.log('\nTrying UI-based installation...');
      await safeGoto(page, `${ODOO_URL}/odoo/settings`);
      await sleep(3000);

      // Look for "Manage Languages" or language settings
      // In Odoo 18, go to Settings > Technical > Translation > Languages
      await safeGoto(page, `${ODOO_URL}/odoo/settings/translations`);
      await sleep(3000);

      const title = await page.title();
      console.log('Current page title:', title);
    }

    // Verify after installation
    const langRecheck = await rpc(page, 'res.lang', 'search_read',
      [[['code', '=', 'zh_TW']]], { fields: ['name', 'code', 'active'] });
    console.log('Post-install verification:', JSON.stringify(langRecheck.result));
    langInstalled = langRecheck.result && langRecheck.result.length > 0 && langRecheck.result[0].active;
  }

  console.log(`\nzh_TW installed and active: ${langInstalled ? 'YES' : 'NO'}`);

  // If still not installed, try installing through Settings UI directly
  if (!langInstalled) {
    console.log('\nAttempting UI-based language installation...');
    await safeGoto(page, `${ODOO_URL}/odoo/settings`);
    await sleep(3000);

    // Screenshot the settings page
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/00_settings_before_install.png`, fullPage: false });

    // Try to find the "Activate Languages" or manage languages button
    // In Odoo 18 settings, there should be a language section
    const langSectionExists = await page.evaluate(() => {
      const body = document.body.textContent;
      return {
        hasLanguage: body.includes('Language'),
        hasTranslation: body.includes('Translation'),
        hasActivate: body.includes('Activate'),
        hasManage: body.includes('Manage'),
      };
    });
    console.log('Settings page features:', JSON.stringify(langSectionExists));

    // Try the direct action URL for language installation
    // action_id for base.language.install might be accessible
    console.log('Trying direct action for language install...');

    // Try to get the action for installing languages
    const actionResult = await rpc(page, 'ir.actions.act_window', 'search_read',
      [[['res_model', '=', 'base.language.install']]], { fields: ['name', 'id'], limit: 5 });
    console.log('Language install actions:', JSON.stringify(actionResult.result));

    // Try a different approach - use odoo shell/xmlrpc
    console.log('Trying base.language.install with overwrite=true...');
    const installAttempt2 = await page.evaluate(async () => {
      // Create wizard with overwrite
      const createResp = await fetch('/web/dataset/call_kw/base.language.install/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'call',
          params: {
            model: 'base.language.install',
            method: 'create',
            args: [{ overwrite: true }],
            kwargs: {}
          }
        })
      });
      const createData = await createResp.json();
      if (createData.error) return { step: 'create', error: createData.error.data.message };

      const wizardId = createData.result;

      // Search for zh_TW in res.lang with active_test=false
      const langResp = await fetch('/web/dataset/call_kw/res.lang/search_read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'call',
          params: {
            model: 'res.lang',
            method: 'search_read',
            args: [[['code', '=', 'zh_TW']]],
            kwargs: {
              fields: ['id', 'name', 'code', 'active'],
              context: { active_test: false }
            }
          }
        })
      });
      const langData = await langResp.json();
      if (langData.error) return { step: 'search', error: langData.error.data.message };

      if (!langData.result || langData.result.length === 0) {
        return { step: 'search', error: 'zh_TW not found even with active_test=false', all_langs: langData.result };
      }

      const langId = langData.result[0].id;
      const langName = langData.result[0].name;
      const langActive = langData.result[0].active;

      // Write lang_ids to wizard
      const writeResp = await fetch('/web/dataset/call_kw/base.language.install/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'call',
          params: {
            model: 'base.language.install',
            method: 'write',
            args: [[wizardId], { lang_ids: [[6, 0, [langId]]] }],
            kwargs: {}
          }
        })
      });
      const writeData = await writeResp.json();
      if (writeData.error) return { step: 'write', error: writeData.error.data.message };

      // Execute lang_install
      const installResp = await fetch('/web/dataset/call_kw/base.language.install/lang_install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 4,
          method: 'call',
          params: {
            model: 'base.language.install',
            method: 'lang_install',
            args: [[wizardId]],
            kwargs: {}
          }
        })
      });
      const installData = await installResp.json();
      if (installData.error) return { step: 'lang_install', error: installData.error.data.message };

      return { success: true, wizardId, langId, langName, langActive, result: installData.result };
    });

    console.log('Install attempt 2:', JSON.stringify(installAttempt2, null, 2));

    // Re-verify
    const langRecheck2 = await rpc(page, 'res.lang', 'search_read',
      [[['code', '=', 'zh_TW']]], { fields: ['name', 'code', 'active'] });
    console.log('Final verification:', JSON.stringify(langRecheck2.result));
    langInstalled = langRecheck2.result && langRecheck2.result.length > 0 && langRecheck2.result[0].active;
    console.log(`zh_TW installed and active: ${langInstalled ? 'YES' : 'NO'}`);
  }

  // Step 3: Change admin user language to zh_TW
  console.log('\n=== Step 3: Change Admin User Language to zh_TW ===');

  const changeResult = await rpc(page, 'res.users', 'search_read',
    [[['login', '=', 'admin']]], { fields: ['name', 'login', 'lang'], limit: 1 });
  const adminId = changeResult.result[0].id;
  const prevLang = changeResult.result[0].lang;
  console.log(`Admin user ID: ${adminId}, Current lang: ${prevLang}`);

  const writeResult = await rpc(page, 'res.users', 'write',
    [[adminId], { lang: 'zh_TW' }], {});
  console.log('Language change result:', writeResult.result);

  // Step 4: Reload and verify zh_TW translations
  console.log('\n=== Step 4: Reload and Verify zh_TW Translations ===');
  // Clear browser caches
  await page.evaluate(() => {
    // Clear sessionStorage and localStorage to force reload of translations
    try { sessionStorage.clear(); } catch(e) {}
    try { localStorage.clear(); } catch(e) {}
  });
  await safeGoto(page, `${ODOO_URL}/odoo`);
  await sleep(3000);

  await page.screenshot({ path: `${SCREENSHOTS_DIR}/02_main_page_zh_tw.png`, fullPage: false });
  console.log('Screenshot: 02_main_page_zh_tw.png');

  const pageContent = await page.textContent('body');

  // Traditional Chinese key terms
  const traditionalTerms = ['會計', '設定', '討論', '日曆', '聯絡人', '銷售', '採購', '庫存', '發票', '資產', '應用程式'];
  const simplifiedTerms = ['会计', '讨论', '日历', '联络人', '采购', '库存', '应用程序'];

  console.log('\nChecking for Traditional Chinese terms on main page:');
  let traditionalFound = 0;
  for (const term of traditionalTerms) {
    const found = pageContent.includes(term);
    console.log(`  ${term}: ${found ? 'FOUND' : 'not found'}`);
    if (found) traditionalFound++;
  }

  console.log('\nChecking for Simplified Chinese terms (should NOT appear):');
  let simplifiedFound = 0;
  for (const term of simplifiedTerms) {
    const found = pageContent.includes(term);
    console.log(`  ${term}: ${found ? 'FOUND (BAD!)' : 'not found (good)'}`);
    if (found) simplifiedFound++;
  }

  console.log(`\nTraditional: ${traditionalFound}/${traditionalTerms.length}, Simplified: ${simplifiedFound}/${simplifiedTerms.length}`);

  // Print all Chinese text on the page
  const chineseText = pageContent.match(/[\u4e00-\u9fff]+/g);
  if (chineseText) {
    console.log(`\nChinese text fragments (first 50): ${chineseText.slice(0, 50).join(', ')}`);
  } else {
    console.log('\nNo Chinese text found on page! Checking page title...');
    console.log('Title:', await page.title());
  }

  // Step 5: Settings page
  console.log('\n=== Step 5: Settings Page in zh_TW ===');
  await safeGoto(page, `${ODOO_URL}/odoo/settings`);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/03_settings_zh_tw.png`, fullPage: false });
  console.log('Screenshot: 03_settings_zh_tw.png');

  const settingsContent = await page.textContent('body');
  const settingsTerms = ['設定', '使用者', '公司', '技術', '一般設定', '翻譯'];
  console.log('Settings page check:');
  for (const term of settingsTerms) {
    console.log(`  ${term}: ${settingsContent.includes(term) ? 'FOUND' : 'not found'}`);
  }
  const settingsChinese = settingsContent.match(/[\u4e00-\u9fff]+/g);
  if (settingsChinese) {
    console.log(`Settings Chinese fragments (first 30): ${settingsChinese.slice(0, 30).join(', ')}`);
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
  console.log('\nAccounting Traditional check:');
  for (const t of acctTraditional) {
    const f = acctContent.includes(t);
    console.log(`  ${t}: ${f ? 'FOUND' : 'not found'}`);
    if (f) acctTradFound++;
  }
  console.log('\nAccounting Simplified check (should NOT appear):');
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
    console.log(`Accounting Chinese fragments (first 50): ${acctChinese.slice(0, 50).join(', ')}`);
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
  console.log('Invoices page check:');
  for (const t of invTerms) {
    console.log(`  ${t}: ${invContent.includes(t) ? 'FOUND' : 'not found'}`);
  }
  const invChinese = invContent.match(/[\u4e00-\u9fff]+/g);
  if (invChinese) {
    console.log(`Invoices Chinese fragments (first 30): ${invChinese.slice(0, 30).join(', ')}`);
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
  console.log(`English UI restored: ${hasEnglish ? 'YES' : 'NO'}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`1. zh_TW installed/active: ${langInstalled ? 'YES' : 'NO'}`);
  console.log(`2. Traditional Chinese on main page: ${traditionalFound}/${traditionalTerms.length}`);
  console.log(`3. Simplified on main page (should=0): ${simplifiedFound}`);
  console.log(`4. Traditional in Accounting: ${acctTradFound}/${acctTraditional.length}`);
  console.log(`5. Simplified in Accounting (should=0): ${acctSimpFound}`);
  console.log(`6. English restored: ${hasEnglish ? 'YES' : 'NO'}`);

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
}

main().catch(err => {
  console.error('ERROR:', err.message || err);
  process.exit(1);
});
