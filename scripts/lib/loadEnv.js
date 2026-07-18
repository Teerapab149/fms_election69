// scripts/lib/loadEnv.js — minimal .env loader for standalone node scripts.
//
// Mirrors e2e/helpers/fixtures.js readEnvFile: pull DATABASE_URL,
// BALLOT_CHAIN_SECRET, ELECTION_BALLOT_PUBLIC_KEY, etc. into process.env from
// .env / .env.local without adding a dotenv dependency. Existing env wins.
const fs = require("fs");
const path = require("path");

function loadEnv(files = [".env", ".env.local"]) {
  for (const file of files) {
    let txt;
    try {
      txt = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    } catch {
      continue;
    }
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const key = m[1];
      if (process.env[key] !== undefined) continue; // don't clobber a real env
      process.env[key] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

module.exports = { loadEnv };
