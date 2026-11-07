# fixsec-test-vuln

A small Node.js project used to test FixSec AI. It reads `JWT_SECRET` from the environment and confirms that the secret is available, without printing it.

Requires Node.js 22 or later.

## Setup

```sh
npm ci
npm run setup
npm start
```

`npm run setup` creates a git-ignored `.env` file containing a random secret. It never overwrites an existing `.env`.

To supply the secret another way, set `JWT_SECRET` in the environment. A value set there takes priority over `.env`. The secret must be at least 32 characters long. If it is missing or too short, `npm start` exits with code 1.

## Tests

```sh
npm test
```
