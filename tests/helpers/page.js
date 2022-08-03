const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

// experimental
class Facade {
  constructor() {
    this.page = Facade.setup().page;
    return new Proxy(this, this);
  }

  get(target, prop) {
    console.log(target);
    console.log(prop);
    // return prop in this ? this.prop : this.page[prop];
  }

  apply(target, thisArg, args) {
    console.log(target);
    console.log(thisArg);
    console.log(args);
  }

  static async setup() {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();
    return { browser, page };
  }
}
// experimental

const login = async function (page) {
  const user = await userFactory();
  const { session, sessionSig } = sessionFactory(user);

  await page.setCookie({
    name: 'session',
    value: session,
  });
  await page.setCookie({
    name: 'session.sig',
    value: sessionSig,
  });

  // await page.reload();
  await page.goto('http://localhost:3000/blogs');
  await page.waitForSelector('a[href="/auth/logout"]');
};

const getContents = async function (page, selector) {
  return await page.$eval(selector, (el) => el.innerHTML);
};

const get = async function (path, page) {
  return await page.evaluate(async (_path) => {
    const res = await fetch(_path, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await res.json();
  }, path);
};

const post = async function (path, payload, page) {
  return await page.evaluate(
    async (_path, _payload) => {
      const res = await fetch(_path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(_payload),
      });
      return await res.json();
    },
    path,
    payload
  );
};

const execRequests = function (actions, page) {
  return Promise.all(
    actions.map(({ method, path, data }) => {
      if (method === 'post') {
        return post(path, data, page);
      } else if (method === 'get') {
        return get(path, page);
      }
    })
  );
};

module.exports = { login, getContents, get, post, execRequests, Facade };
