// Self-test suite for the Stock Price Checker (served at GET /_api/get-tests).
'use strict';

const assert = require('node:assert');

function entry(context, run) {
  const t0 = Date.now();
  return Promise.resolve()
    .then(run)
    .then(
      (assertions) => ({ context, state: 'passed', assertions: Array.isArray(assertions) && assertions.length ? assertions : ['ok'], time: Date.now() - t0 }),
      (err) => ({ context, state: 'failed', assertions: [String(err.message || err)] })
    );
}

async function runAll() {
  const base = process.env.SELF_TEST_BASE || `http://127.0.0.1:${process.env.PORT || 3011}`;
  const get = (qs) => fetch(`${base}/api/stock-prices${qs ? `?${qs}` : ''}`).then(async (r) => {
    assert.strictEqual(r.status, 200);
    return r.json();
  });

  const t = [];
  t.push(
    entry('Functional Tests > GET /api/stock-prices?stock=GOOG returns a stockData object', async () => {
      const d = await get('stock=GOOG');
      assert.strictEqual(typeof d.stockData, 'object');
      assert.strictEqual(d.stockData.stock, 'GOOG');
      return [2];
    }),
    entry('Functional Tests > stockData carries stock (string), price (number) and likes (number)', async () => {
      const d = await get('stock=GOOG');
      assert.strictEqual(typeof d.stockData.stock, 'string');
      assert.strictEqual(typeof d.stockData.price, 'string');
      assert.strictEqual(typeof d.stockData.likes, 'number');
      assert.ok(parseFloat(d.stockData.price) > 0);
      return [4];
    }),
    entry('Functional Tests > like=true increments likes once for the same IP', async () => {
      const before = await get('stock=GOOG');
      const liked = await get('stock=GOOG&like=true');
      const after = await get('stock=GOOG');
assert.strictEqual(liked.stockData.likes, Math.max(before.stockData.likes, 1));
      const again = await get('stock=GOOG&like=true');
      assert.strictEqual(again.stockData.likes, liked.stockData.likes, 'a second like from the same IP is ignored');
      return [2];
    }),
    entry('Functional Tests > two symbols return an array with rel_likes on both', async () => {
      const d = await get('stock=GOOG&stock=MSFT');
      assert.ok(Array.isArray(d.stockData));
      assert.strictEqual(d.stockData.length, 2);
      assert.ok('rel_likes' in d.stockData[0]);
      assert.ok('rel_likes' in d.stockData[1]);
      assert.strictEqual(d.stockData[0].stock, 'GOOG');
      assert.strictEqual(d.stockData[1].stock, 'MSFT');
      return [5];
    }),
    entry('Functional Tests > /_api/app-info exposes the security headers', async () => {
      const info = await (await fetch(`${base}/_api/app-info`)).json();
      assert.ok(info.headers['content-security-policy'].includes("script-src 'self'"));
      assert.ok(info.headers['content-security-policy'].includes("style-src 'self'"));
      return [2];
    })
  );  const out = [];
  for (const p of t) out.push(await p);
  return out;
}

module.exports = { runAll };
