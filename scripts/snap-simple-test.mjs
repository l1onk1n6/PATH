import { chromium } from 'playwright';

const FAKE_ORIGIN = 'http://path-screenshot.internal';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

const ctx = await browser.newContext({ viewport: { width: 900, height: 1100 } });
const page = await ctx.newPage();

// Serve a simple test page
await page.route(`${FAKE_ORIGIN}/**`, async (route) => {
  const url = new URL(route.request().url());
  console.log(`[route] ${url.pathname}`);

  if (url.pathname === '/' || url.pathname === '/index.html') {
    return route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div id="root"></div>
  <script type="module">
    console.log('module script running');
    document.getElementById('root').innerHTML = '<h1>Hello from ES module!</h1>';
  </script>
</body>
</html>`,
    });
  }

  return route.abort();
});

console.log('Navigating to test page...');
await page.goto(`${FAKE_ORIGIN}/`, { waitUntil: 'commit', timeout: 10000 });
await page.waitForTimeout(3000);

const content = await page.evaluate(() => document.getElementById('root')?.innerHTML ?? 'no root');
const logs = [];
page.on('console', m => logs.push(m.text()));

console.log('Root content:', content);

await browser.close();
