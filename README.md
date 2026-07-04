# Event Bus Test Assignment — Publish & Receive

## Task

Test an Event Bus by publishing an `OrderCreated` event via HTTP POST to a webhook.site
endpoint, waiting for delivery via polling, and verifying that the received payload
matches what was sent and passes schema validation.

## Setup and run instructions

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Configure environment

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

By default it's already set up to work against the public webhook.site API, no token
required:

```
WEBHOOK_SITE_BASE_URL=https://webhook.site
WEBHOOK_SITE_TOKEN=

POLLING_TIMEOUT_MS=10000
POLLING_INTERVAL_MS=500
```

`WEBHOOK_SITE_TOKEN` is left empty on purpose — the public webhook.site API doesn't
require auth for creating endpoints or fetching requests. It's reserved in case a
paid/authenticated setup is needed later.

`POLLING_TIMEOUT_MS` / `POLLING_INTERVAL_MS` control how long and how often
`EventReceiver.awaitDelivery` polls webhook.site for the incoming event before giving up.

### Run the tests

```bash
npm test
```

This will:

1. Create a fresh webhook.site endpoint before the run (`global-setup.js`)
2. Publish a generated `OrderCreated` event to it
3. Poll until the event shows up (or fail after `POLLING_TIMEOUT_MS`)
4. Assert the received event matches what was sent and passes schema validation
5. Delete the webhook.site endpoint after the run (`global-teardown.js`)

Expected output looks like:

```
[SETUP] Created webhook.site endpoint: https://webhook.site/<uuid>
[Publish] { "eventId": "evt-...", "eventType": "OrderCreated", ... }
[RECEIVE] correlationId=... matched requestUuid=... after ~1700ms
[REPORT] ✅ Event Bus - OrderCreated publish & receive publishes an OrderCreated event and receives it via webhook.site

[REPORT] Event Bus test run summary
[REPORT] Total: 1 | Passed: 1 | Failed: 0

PASS  tests/order-creation.test.js
[TEARDOWN] Deleted webhook.site endpoint: <uuid>
```

### Project structure

```
clients/                  HTTP wrapper for the webhook.site API (no business logic)
  webhook-site.js

services/                 publish/receive logic
  event-publisher.js       publishes an event via the client, logs it
  event-reciever.js        awaitDelivery — polls the client until a match is found or times out

fixtures/                 test data generation
  order-event-factory.js   builds a full OrderCreated event with a random payload

utils/                    reusable schema utility
  schema-validator.js      loads a YAML schema and validates data against it with AJV

schemas/                  OpenAPI-compatible YAML schemas, one per event/response type
  order-created-event.yml

reporters/                custom Jest reporter
  event-bus-reporter.js    run-level pass/fail summary on top of the default Jest output

tests/
  order-creation.test.js   the actual publish & receive test

global-setup.js            creates a webhook.site endpoint before the run
global-teardown.js         deletes the endpoint after the run
jest.config.js
.env.example
package.json
package-lock.json
```

## Summary

### Why I structured it this way

The assignment already dictated a lot of the shape: a dedicated client class per
external service in `clients/`, an `awaitDelivery` method in `EventReceiver`, schemas as
standalone YAML files. On top of that, I split the rest into `services/` (publish/receive
logic) and `fixtures/` (test data generation) so the test file itself barely contains any
logic — it reads like a script: generate an event, publish it, wait for it, compare it,
validate it. If another event bus needs testing later (RabbitMQ, SQS, another webhook
provider), that just means a new client and a new service; the data generator and schema
validator stay untouched.

`awaitDelivery` living in `EventReceiver` rather than in the test wasn't just about
satisfying the "no raw setTimeout" requirement — retry/timeout logic isn't something that
belongs in a test file anyway, since it's the same regardless of which event you're
waiting for.

### What was a deliberate call, and the trade-offs behind it

- **Polling timeout/interval in `.env` instead of hardcoded** — CI networks are often
  slower than local ones, so bumping the timeout should be a one-line config change, not
  a code change.
- **Custom reporter alongside the default one, not instead of it** — the default
  PASS/FAIL Jest output stays intact; the custom reporter only adds a short summary on
  top. Less risk of confusing anyone on CI about why the standard report disappeared.
- **One test per event type** — no parameterized test across multiple event types, since
  for a single event type that would just add abstraction with no real benefit yet. If a
  second event type is added, parameterizing then makes sense.

### What I'd add or improve with more time

- Retries at the HTTP client level (webhook.site occasionally returns 5xx or hits rate
  limits) — right now if the token-creation request fails, the whole test fails with it.
- Negative test cases: an intentionally broken payload that fails schema validation, or
  an event that never arrives within the timeout — right now there's only the happy path.
- Running multiple tests in parallel with separate tokens instead of one shared global
  token (see scaling notes below).
- Logging to a file, not just the console, so CI has a separate artifact of all
  publish/receive events.
- A configurable backoff for `awaitDelivery` instead of a fixed polling interval.

### How this scales to 100+ tests

The biggest bottleneck right now is the single shared webhook.site token for the whole
run (`global-setup.js` / `global-teardown.js`). That's fine for one test, but with a
hundred tests running in parallel they'd start stepping on each other —
`getRequests` would return requests from every test at once, and while filtering by
`correlationId` prevents false matches, it's still unnecessary overhead and a race
condition risk if the token gets deleted in teardown while another test is still
checking something.

The fix, without rewriting the architecture, is to create a separate token per test file
(or per `describe` block) in that file's own `beforeAll`/`afterAll`, instead of one token
in `globalSetup`. `WebhookSiteClient` and `EventReceiver` don't need to change for this —
they already take `tokenId` as a parameter rather than holding it internally. Scaling is
about who creates the token and when, not about rewriting clients or services.

`EventReceiver` can already be reused for any number of event types, since it only
matches on `correlationId` and knows nothing about the payload shape. Same with
`schema-validator.js` — it takes the schema as a parameter, so adding a new event type
just means a new YAML file plus a new test file, no changes to the utilities.

Once token-per-test is in place, `--runInBand` can be dropped in favor of parallel Jest
workers — running it in parallel before that change would just cause workers to pick up
each other's requests.
