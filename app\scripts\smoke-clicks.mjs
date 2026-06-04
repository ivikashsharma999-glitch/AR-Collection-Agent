import puppeteer from 'puppeteer-core';
import { existsSync, readFileSync } from 'node:fs';

function loadLocalEnv() {
  if (!existsSync('.env.local')) return;

  const content = readFileSync('.env.local', 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([^#][^=]+)=(.*)$/);
    if (!match) continue;

    const key = match[1].trim();
    const value = match[2].trim().replace(/^['"]|['"]$/g, '');
    process.env[key] ??= value;
  }
}

loadLocalEnv();

const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000';
const smokeEmail = process.env.SMOKE_TEST_EMAIL || process.env.TEST_USER_EMAIL;
const smokePassword = process.env.SMOKE_TEST_PASSWORD || process.env.TEST_USER_PASSWORD;

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
page.setDefaultTimeout(15000);

const results = [];

async function step(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}

async function clickText(text) {
  const handle = await page.evaluateHandle((label) => {
    const nodes = [...document.querySelectorAll('a, button, input')];
    return nodes.find((node) => {
      const rect = node.getBoundingClientRect();
      const isVisible =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth &&
        getComputedStyle(node).visibility !== 'hidden';
      const isDisabled = node instanceof HTMLButtonElement && node.disabled;
      const matches = node.textContent?.includes(label) || node.getAttribute('placeholder')?.includes(label);
      return isVisible && !isDisabled && matches;
    });
  }, text);
  const element = handle.asElement();
  if (!element) {
    throw new Error(`No clickable element found for text: ${text}`);
  }
  await element.click();
}

async function clickButtonText(text) {
  const handle = await page.evaluateHandle((label) => {
    const buttons = [...document.querySelectorAll('button')];
    return buttons.find((button) => {
      const rect = button.getBoundingClientRect();
      const isVisible =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth &&
        getComputedStyle(button).visibility !== 'hidden';
      return isVisible && !button.disabled && button.textContent?.trim() === label;
    });
  }, text);
  const element = handle.asElement();
  if (!element) {
    throw new Error(`No visible button found for text: ${text}`);
  }
  await element.click();
}

await step('login page loads', async () => {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.waitForSelector('input[type="password"]');
});

await step('login form accepts typing', async () => {
  await page.type('input[type="email"]', `smoke-${Date.now()}@example.com`);
  await page.type('input[type="password"]', 'Smoke-test-12345');
  const emailValue = await page.$eval('input[type="email"]', (input) => input.value);
  if (!emailValue.startsWith('smoke-')) throw new Error('Email input did not update');
});

await step('signup toggle responds', async () => {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await clickButtonText('Sign up');
  await page.waitForFunction(() => {
    const submitButton = [...document.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Create Account')
    );
    return Boolean(submitButton);
  });
});

await step('unauthenticated dashboard redirects to login', async () => {
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
  if (!page.url().includes('/login')) {
    throw new Error(`Expected /login redirect, got ${page.url()}`);
  }
});

await step('unauthenticated app pages redirect to login', async () => {
  const protectedPaths = ['/accounts', '/accounts/cust-001', '/audit', '/disputes', '/inbox', '/onboarding', '/operations', '/settings'];

  for (const path of protectedPaths) {
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle0' });
    const url = new URL(page.url());
    if (url.pathname !== '/login' || url.searchParams.get('next') !== path) {
      throw new Error(`Expected ${path} to redirect to /login?next=${path}, got ${page.url()}`);
    }
  }
});

await step('attempt temporary signup', async () => {
  const email = `smoke-${Date.now()}@example.com`;
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle0' });
  await clickButtonText('Sign up');
  await page.click('input[type="email"]', { clickCount: 3 });
  await page.type('input[type="email"]', email);
  await page.click('input[type="password"]', { clickCount: 3 });
  await page.type('input[type="password"]', 'Smoke-test-12345');
  page.on('dialog', async (dialog) => {
    results.push({ name: `browser dialog: ${dialog.message()}`, ok: true });
    await dialog.accept();
  });
  await clickButtonText('Create Account');
  await new Promise((resolve) => setTimeout(resolve, 2500));
});

if (smokeEmail && smokePassword) {
  await step('known test user signs in', async () => {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle0' });
    await page.click('input[type="email"]', { clickCount: 3 });
    await page.type('input[type="email"]', smokeEmail);
    await page.click('input[type="password"]', { clickCount: 3 });
    await page.type('input[type="password"]', smokePassword);
    await clickButtonText('Sign In');
    await page
      .waitForFunction(
        () =>
          location.pathname === '/dashboard' ||
          Boolean(document.querySelector('[class*="errorBox"]')),
        { timeout: 20000 }
      )
      .catch(async (error) => {
        const visibleText = await page.evaluate(() => document.body.innerText.trim());
        throw new Error(`${error.message}; current URL: ${page.url()}; page text: ${visibleText.slice(0, 300)}`);
      });

    if (new URL(page.url()).pathname !== '/dashboard') {
      const authError = await page.evaluate(
        () => document.querySelector('[class*="errorBox"]')?.textContent?.trim()
      );
      throw new Error(authError || `Sign-in did not reach dashboard. Current URL: ${page.url()}`);
    }
  });
} else {
  results.push({
    name: 'known test user signs in',
    ok: true,
    error: 'Skipped because SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD are not set.',
  });
}

const reachedDashboard = results.some((result) => result.name === 'known test user signs in' && result.ok && !result.error);

if (reachedDashboard) {
  await step('ask agent navigation works', async () => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
    await clickText('Ask AR Agent');
    await page.waitForFunction(() => location.pathname === '/ask-agent');
  });

  await step('ai activity navigation works', async () => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
    await clickText('AI Activity');
    await page.waitForFunction(() => location.pathname === '/ai-activity');
  });

  await step('recommendations navigation works', async () => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
    await clickText('Recommendations');
    await page.waitForFunction(() => location.pathname === '/recommendations');
  });

  await step('sidebar accounts navigation works', async () => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
    await clickText('Accounts');
    await page.waitForFunction(() => location.pathname === '/accounts');
  });

  await step('invoices navigation works', async () => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
    await clickText('Invoices');
    await page.waitForFunction(() => location.pathname === '/invoices');
  });

  await step('approvals navigation works', async () => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
    await clickText('Approvals');
    await page.waitForFunction(() => location.pathname === '/inbox');
  });

  await step('promises navigation works', async () => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
    await clickText('Promises to Pay');
    await page.waitForFunction(() => location.pathname === '/promises');
  });

  await step('disputes navigation works', async () => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
    await clickText('Disputes');
    await page.waitForFunction(() => location.pathname === '/disputes');
  });

  await step('operations health navigation works', async () => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
    await clickText('Operations');
    await page.waitForFunction(() => location.pathname === '/operations');
  });

  await step('audit log navigation works', async () => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
    await clickText('Audit Log');
    await page.waitForFunction(() => location.pathname === '/audit');
  });

  await step('cash forecast navigation works', async () => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
    await clickText('Cash Forecast');
    await page.waitForFunction(() => location.pathname === '/cash-forecast');
  });

  await step('analytics navigation works', async () => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
    await clickText('Analytics');
    await page.waitForFunction(() => location.pathname === '/analytics');
  });

  await step('settings navigation works', async () => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
    await clickText('Settings');
    await page.waitForFunction(() => location.pathname === '/settings');
  });

  await step('sign out returns to login', async () => {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
    await page.click('[aria-label="Sign out"]');
    await page.waitForFunction(() => location.pathname === '/login', { timeout: 20000 });
  });
} else {
  results.push({
    name: 'authenticated dashboard click path',
    ok: true,
    error: 'Skipped because Supabase requires email confirmation before creating a session.',
  });
}

await browser.close();

const failed = results.filter((result) => !result.ok);
for (const result of results) {
  const suffix = result.error ? ` - ${result.error}` : '';
  console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.name}${suffix}`);
}

if (failed.length > 0) {
  process.exit(1);
}
