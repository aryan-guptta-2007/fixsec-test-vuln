const fs = require("node:fs");
const path = require("node:path");

const ENV_FILE = path.join(__dirname, ".env");
const MIN_SECRET_LENGTH = 32;

// Variables already set in the environment take priority over .env.
if (fs.existsSync(ENV_FILE)) {
  process.loadEnvFile(ENV_FILE);
}

const JWT_SECRET = (process.env.JWT_SECRET ?? "").trim();

if (!JWT_SECRET) {
  console.error("JWT_SECRET is not set. Run `npm run setup` to generate one.");
  process.exit(1);
}

if (JWT_SECRET.length < MIN_SECRET_LENGTH) {
  console.error(
    `JWT_SECRET is too short: use at least ${MIN_SECRET_LENGTH} random characters. ` +
      "To generate one, delete .env and run `npm run setup`."
  );
  process.exit(1);
}

// Never log the secret itself.
console.log("JWT_SECRET loaded.");
