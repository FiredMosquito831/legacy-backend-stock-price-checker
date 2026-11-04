# Stock Price Checker

A freeCodeCamp **legacy back end certification project** — written from scratch against the project's published requirements and proven by its own local test suite.

## What it does

Legacy Back-End set reuses the legacy QA Stock Price Checker (bundled offline price feed).

_shared with legacy-infosec-qa._

## Endpoints
- `GET /api/stock-prices`
- `GET /_api/app-info`
- `GET /_api/get-tests`

## How to run

```bash
npm install
npm start            # or: PORT=3456 npm start
```

The server listens on port 3011 by default (override with the PORT environment variable).

## How to test

```bash
node test_local.js
```

Boots the app on a throwaway port, exercises every required endpoint with the spec-critical assertions, and prints `PASS — N local assertions`. A captured green run is in `local-test.log`.

## Notes

See legacy-infosec-qa/stock-price-checker.

## Tech stack

Node.js + Express (a single runtime dependency); plain `assert` for the test suite. No browser, no external services, no public deployment — proven entirely locally.

## License

MIT — see [LICENSE](LICENSE). © FiredMosquito831

## Verification

Built and proven locally: the server is booted on a throwaway port and every endpoint above is
hit with real HTTP requests; **5/5 local assertions passing**
(`node test_local.js`, exit 0). Captured output in [`local-test.log`](local-test.log).

``
  - `GET /api/stock-prices`
  - `GET /_api/app-info`
  - `GET /_api/get-tests`
``

> This service is a per-curriculum copy; the shared logic is mirrored with **legacy-infosec-qa** (see each README).

## Source

Written from scratch against the project's published freeCodeCamp specification. No freeCodeCamp
starter or reference-solution code was used.
