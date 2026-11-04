// Local proof for the Stock Price Checker.
'use strict';

const assert = require('node:assert');
const app = require('./server.js');

let passed = 0;
let srv = null;
const ok = (msg) => {
  passed += 1;
  console.log(`  ok ${passed} ${msg}`);
};

(async () => {
  srv = await new Promise((resolve) => resolve(app.listen(0, '127.0.0.1')));
  const base = `http://127.0.0.1:${srv.address().port}`;
  process.env.SELF_TEST_BASE = base;

  const one = await (await fetch(`${base}/api/stock-prices?stock=GOOG`)).json();
  assert.strictEqual(one.stockData.stock, 'GOOG');
  assert.strictEqual(typeof one.stockData.price, 'string');
  assert.strictEqual(typeof one.stockData.likes, 'number');
  assert.strictEqual(one.stockData.price, '148.25');
  ok('single stock -> { stock, price(number), likes(number) } from the bundled feed');

  const two = await (await fetch(`${base}/api/stock-prices?stock=GOOG&stock=MSFT`)).json();
  assert.ok(Array.isArray(two.stockData));
  assert.ok('rel_likes' in two.stockData[0]);
  assert.ok('rel_likes' in two.stockData[1]);
  ok('two stocks -> array with rel_likes');

  const liked = await (await fetch(`${base}/api/stock-prices?stock=GOOG&like=true`)).json();
  const liked2 = await (await fetch(`${base}/api/stock-prices?stock=GOOG&like=true`)).json();
  assert.strictEqual(liked.stockData.likes, 1);
  assert.strictEqual(liked2.stockData.likes, 1, 'second like from the same IP is ignored');
  ok('one like per IP');

  const info = await (await fetch(`${base}/_api/app-info`)).json();
  assert.ok(info.headers['content-security-policy'].includes("script-src 'self'"));
  assert.ok(info.headers['content-security-policy'].includes("style-src 'self'"));
  ok('content-security-policy allows scripts/css from self only');

  const reports = await (await fetch(`${base}/_api/get-tests`)).json();
  assert.ok(reports.length >= 5);
  reports.forEach((t) => {
    assert.strictEqual(t.state, 'passed');
    assert.ok(t.assertions.length >= 1);
  });
  ok(`_api/get-tests: ${reports.length} tests, all passed`);

  srv.closeAllConnections();
  srv.close(() => {
    console.log(`\nPASS — ${passed} local assertions`);
  });
})().catch((err) => {
  console.error('FAIL', err);
  if (srv) { srv.closeAllConnections(); srv.close(); }
  process.exitCode = 1;
});
