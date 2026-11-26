import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'scripts/feature-map.json'), 'utf8'));
const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
const base = (option('--base') || 'http://localhost:3000').replace(/\/$/, '');
const outDir = path.resolve(root, option('--out') || 'artifacts/verify');
const mobile = args.includes('--mobile') && args.splice(args.indexOf('--mobile'), 1);

if (args.includes('--list')) {
  for (const feature of map.features) console.log(`${feature.id.padEnd(36)} ${Object.values(feature.names).join(' | ')}`);
  process.exit(0);
}

const unknown = args.filter(id => !map.features.some(feature => feature.id === id));
if (unknown.length) {
  console.error(`Unknown feature id: ${unknown.join(', ')}. Run with --list to see the feature map.`);
  process.exit(2);
}
const selected = args.length ? map.features.filter(feature => args.includes(feature.id)) : map.features;

const executablePath = process.env.CULUA_BROWSER_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : { channel: 'chrome' }).catch(error => {
  console.error(`Could not start Chrome (${error.message.split('\n')[0]}). Install Google Chrome or set CULUA_BROWSER_PATH to a Chromium executable.`);
  process.exit(2);
});
fs.mkdirSync(outDir, { recursive: true });
const sameOrigin = url => { try { return new URL(url).origin === new URL(base).origin; } catch { return false; } };

async function runStep(page, step, memory, screenshots) {
  const timeout = step.timeout ?? 15000;
  if (step.goto) {
    const response = await page.goto(base + encodeURI(step.goto), { waitUntil: 'domcontentloaded' });
    if (!response || response.status() >= 400) throw new Error(`GET ${step.goto} returned ${response?.status()}`);
    await page.waitForFunction(() => {
      const element = document.querySelector('header, main, body > div');
      return element && Object.keys(element).some(key => key.startsWith('__reactFiber'));
    }, null, { timeout: 60000 }).catch(() => { throw new Error(`${step.goto} never hydrated; interactions would hit static HTML`); });
  } else if (step.nav) {
    const desktop = page.locator(`nav.desktop-nav a[href='${step.nav}']`);
    if (await desktop.isVisible()) await desktop.click({ timeout });
    else {
      await page.locator('header button.menu-toggle').click({ timeout });
      await page.locator(`#mobile-navigation a[href='${step.nav}']`).click({ timeout });
    }
  } else if (step.click) {
    await page.locator(step.click).first().click({ timeout });
  } else if (step.select) {
    await page.locator(step.select).first().selectOption(step.value, { timeout });
  } else if (step.expect) {
    const locator = page.locator(step.expect);
    await locator.first().waitFor({ state: step.state ?? 'visible', timeout });
    if (step.min) {
      const count = await locator.count();
      if (count < step.min) throw new Error(`expected at least ${step.min} of ${step.expect}, found ${count}`);
    }
    if (step.text) {
      const text = await locator.first().textContent();
      if (!text?.includes(step.text)) throw new Error(`expected ${step.expect} to contain "${step.text}", got "${text?.trim().slice(0, 80)}"`);
    }
  } else if (step.expectUrl) {
    await page.waitForURL(url => new URL(url).pathname.startsWith(step.expectUrl), { timeout });
  } else if (step.tag) {
    await page.locator(step.tag).first().evaluate((element, name) => { element.dataset.driveTag = name; }, step.as, { timeout });
  } else if (step.expectTagged) {
    const tagged = await page.locator(step.expectTagged).first().getAttribute('data-drive-tag', { timeout });
    if (tagged !== step.as) throw new Error(`${step.expectTagged} is a new element; it was remounted instead of kept`);
  } else if (step.rememberAttr) {
    memory[step.as] = await page.locator(step.rememberAttr).first().getAttribute(step.attr, { timeout });
  } else if (step.expectAttrChanged) {
    const locator = page.locator(step.expectAttrChanged).first();
    const deadline = Date.now() + timeout;
    while ((await locator.getAttribute(step.attr)) === memory[step.from]) {
      if (Date.now() > deadline) throw new Error(`${step.expectAttrChanged} ${step.attr} stayed "${memory[step.from]}"`);
      await page.waitForTimeout(100);
    }
  } else if (step.screenshot) {
    const file = path.join(outDir, `${step.screenshot}${mobile ? '-mobile' : ''}.png`);
    await page.screenshot({ path: file, fullPage: false });
    screenshots.push(path.relative(root, file).split(path.sep).join('/'));
  } else {
    throw new Error(`Unknown step ${JSON.stringify(step)}`);
  }
}

const results = [];
for (const feature of selected) {
  const context = await browser.newContext(mobile ? { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', message => { if (message.type() === 'error' && sameOrigin(message.location().url || base)) consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));
  const failedRequests = [];
  page.on('response', response => { if (response.status() >= 500 && sameOrigin(response.url())) failedRequests.push(`${response.status()} ${response.request().method()} ${decodeURI(response.url())}`); });
  const result = { id: feature.id, ok: true, screenshots: [], consoleErrors, pageErrors, failedRequests };
  const memory = {};
  for (const [index, step] of feature.steps.entries()) {
    try {
      await runStep(page, step, memory, result.screenshots);
    } catch (error) {
      result.ok = false;
      result.failedStep = index;
      result.error = error.message.split('\n')[0];
      const file = path.join(outDir, `${feature.id}-failure.png`);
      await page.screenshot({ path: file }).catch(() => {});
      result.screenshots.push(path.relative(root, file).split(path.sep).join('/'));
      break;
    }
  }
  if (pageErrors.length) { result.ok = false; result.error ??= `uncaught page error: ${pageErrors[0]}`; }
  if (failedRequests.length) { result.ok = false; result.error ??= `server error: ${failedRequests[0]}`; }
  const allowed = (feature.allowConsoleErrors ?? []).map(pattern => new RegExp(pattern));
  const unexpected = consoleErrors.filter(text => !allowed.some(pattern => pattern.test(text)));
  if (unexpected.length) { result.ok = false; result.error ??= `console error: ${unexpected[0].slice(0, 160)}`; }
  results.push(result);
  console.log(`${result.ok ? 'PASS' : 'FAIL'} ${feature.id}${result.ok ? '' : ` (step ${result.failedStep ?? '-'}: ${result.error})`}${consoleErrors.length ? ` [${consoleErrors.length} console error(s)]` : ''}`);
  await context.close();
}
await browser.close();

fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ base, mobile: Boolean(mobile), at: new Date().toISOString(), results }, null, 2));
const failed = results.filter(result => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} features passed. Report: ${path.relative(root, path.join(outDir, 'report.json'))}`);
process.exit(failed.length ? 1 : 0);
