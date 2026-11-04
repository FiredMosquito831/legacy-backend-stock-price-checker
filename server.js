// Stock Price Checker — freeCodeCamp legacy InfoSec/QA certification project.
// Legacy variant: stockData.price is a decimal STRING (legacy spec), likes is an int.
//   GET /api/stock-prices?stock=GOOG[&stock=MSFT][&like=true]
//     one symbol  -> { stockData: { stock, price, likes } }
//     two symbols -> { stockData: [ { stock, price, rel_likes }, { ... } ] }
//   GET /_api/app-info  -> the security headers this app sets
//   GET /_api/get-tests -> self-test report (fCC harness endpoint)
//
// Price data: a bundled offline feed (data/prices.json) stands in for the old
// finance.google.com endpoint so the service runs with no external dependency.
'use strict';

const path = require('path');
const express = require('express');
const PRICES = require('./data/prices.json');

const app = express();

// --- Security headers (Content Security Policy, no DNS prefetching, ...) -----
const HEADER_MAP = {
  'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'none'; font-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'self'",
  'x-content-type-options': 'nosniff',
  'x-dns-prefetch-control': 'off',
  'x-frame-options': 'SAMEORIGIN',
  'referrer-policy': 'same-origin'
};
app.use((req, res, next) => {
  for (const [k, v] of Object.entries(HEADER_MAP)) res.setHeader(k, v);
  next();
});

// --- In-memory like store (1 like per IP, per symbol) ------------------------
const likes = new Map(); // symbol -> { count: number, ips: Set<ip> }

function likeState(symbol) {
  if (!likes.has(symbol)) likes.set(symbol, { count: 0, ips: new Set() });
  return likes.get(symbol);
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || '127.0.0.1';
}

function priceOf(symbol) {
  // Bundled offline feed, with a deterministic fallback price for unknown tickers.
  if (Object.prototype.hasOwnProperty.call(PRICES, symbol)) return PRICES[symbol];
  let h = 0;
  for (const ch of symbol) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Number((10 + (h % 4000) / 10).toFixed(2));
}

app.get('/api/stock-prices', (req, res) => {
  const raw = req.query.stock;
  const symbols = (Array.isArray(raw) ? raw : [raw]).map((s) => String(s || '').toUpperCase()).filter(Boolean);
  if (symbols.length === 0) return res.json({ stockData: { error: 'invalid symbol' } });

  const like = String(req.query.like) === 'true';
  const ip = clientIp(req);
  const build = (sym) => {
    const st = likeState(sym);
    if (like && !st.ips.has(ip)) {
      st.ips.add(ip);
      st.count += 1;
    }
    return { stock: sym, price: String(priceOf(sym)), likes: st.count };
  };

  if (symbols.length === 1) {
    const data = build(symbols[0]);
    return res.json({ stockData: data });
  }

  const a = build(symbols[0]);
  const b = build(symbols[1]);
  a.rel_likes = a.likes - b.likes;
  b.rel_likes = b.likes - a.likes;
  delete a.likes;
  delete b.likes;
  res.json({ stockData: [a, b] });
});

// --- Self-test / harness endpoints -------------------------------------------
app.get('/_api/app-info', (req, res) => res.json({ headers: { ...HEADER_MAP } }));

const tests = require('./tests.js');
let cached;
app.get('/_api/get-tests', async (req, res) => {
  if (!cached) cached = await tests.runAll();
  res.json(cached);
});

app.get('/', (req, res) =>
  res.send(
    '<!doctype html><meta charset="utf-8"><title>Stock Price Checker</title>' +
    '<p>Stock Price Checker — GET /api/stock-prices?stock=GOOG</p>'
  )
);

const PORT = process.env.PORT || 3011;
if (require.main === module) {
  app.listen(PORT, () => console.log(`stock-price-checker listening on :${PORT}`));
}

module.exports = app;
