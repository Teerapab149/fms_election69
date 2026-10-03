// Writes throwaway secrets for the e2e job into $GITHUB_ENV (or prints them
// as KEY=VALUE lines when run by hand). Nothing here is a real secret: the keys
// are generated per run and die with the runner, so no repository secret is
// needed and nothing can leak. The PEM is stored \n-escaped on one line because
// GITHUB_ENV is line-based; src/lib/ballotCrypto.js normalizePem() accepts that.
import crypto from "node:crypto";
import fs from "node:fs";

const { publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = publicKey.export({ type: "spki", format: "pem" }).trim().replace(/\n/g, "\\n");
const vars = {
  ELECTION_BALLOT_PUBLIC_KEY: pem,
  BALLOT_CHAIN_SECRET: crypto.randomBytes(32).toString("hex"),
  ADMIN_JWT_SECRET: crypto.randomBytes(32).toString("hex"),
  NEXTAUTH_SECRET: crypto.randomBytes(32).toString("hex"),
};
const out = Object.entries(vars).map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
if (process.env.GITHUB_ENV) fs.appendFileSync(process.env.GITHUB_ENV, out);
else process.stdout.write(out);
