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
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await browser.close();
});

describe('When logged in', () => {
  beforeEach(async () => {
    await PageHelper.login(page);
    await page.click('a.btn-floating');
  });

  test('can see blog create form', async () => {
    const text = await PageHelper.getContents(page, 'form label');
    expect(text).toBe('Blog Title');
  });

  describe('and using invalid inputs', () => {
    beforeEach(async () => {
      await page.click('form button');
    });
    test('form shows error message', async () => {
      const titleError = await PageHelper.getContents(page, '.title .red-text');
      const contentError = await PageHelper.getContents(
        page,
        '.content .red-text'
      );

      expect(titleError).toBe('You must provide a value');
      expect(contentError).toBe('You must provide a value');
    });
  });

  describe('and using valid inputs', () => {
    beforeEach(async () => {
      await page.type('.title input', 'My test title');
      await page.type('.content input', 'My test content');
      await page.click('form button');
    });
    test('submitting takes user to review screen', async () => {
      const text = await PageHelper.getContents(page, 'h5');
      expect(text).toEqual('Please confirm your entries');
    });
    test('submitting and saving adds blog to index page', async () => {
      await page.click('button.green.btn-flat');
      await page.waitForSelector('.card');

      const title = await PageHelper.getContents(page, '.card-title');
      const content = await PageHelper.getContents(page, 'p');

      expect(title).toBe('My test title');
      expect(content).toBe('My test content');
    });
  });
});

describe('When not logged in', () => {
  const actions = [
    {
      method: 'get',
      path: '/api/blogs',
    },
    {
      method: 'post',
      path: '/api/blogs',
      data: { title: 'My title', content: 'MyContent' },
    },
  ];
  test('Blog related actions are prohibited', async () => {
    const results = await PageHelper.execRequests(actions, page);
    for (let result of results) {
      expect(result).toEqual({ error: 'You must log in!' });
    }
  });
});
