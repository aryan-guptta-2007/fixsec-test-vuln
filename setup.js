const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ENV_FILE = path.join(__dirname, ".env");
const secret = crypto.randomBytes(32).toString("hex");

try {
  // "wx" fails if .env exists, so an existing secret is never overwritten.
  fs.writeFileSync(ENV_FILE, `JWT_SECRET=${secret}\n`, { flag: "wx", mode: 0o600 });
  console.log("Created .env with a new JWT_SECRET.");
} catch (err) {
  if (err.code !== "EEXIST") throw err;
  console.log(".env already exists, leaving it unchanged.");
}
