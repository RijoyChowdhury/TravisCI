const puppeteer = require('puppeteer');
const PageHelper = require('./helpers/page');

jest.setTimeout(60000);

let browser, page;

beforeEach(async () => {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  page = await browser.newPage();
  // page = new PageHelper.Facade();
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await browser.close();
});

test('Header has correct text', async () => {
  const text = await PageHelper.getContents(page, 'a.brand-logo');
  expect(text).toBe('Blogster');
});

test('Click on Login button to start OAuth flow', async () => {
  await page.click('.right a');
  const url = await page.url();
  expect(url).toMatch(/accounts\.google\.com/);
});

test('Show logout button when signed in', async () => {
  await PageHelper.login(page);
  const text = await PageHelper.getContents(page, 'a[href="/auth/logout"]');
  expect(text).toBe('Logout');
});
