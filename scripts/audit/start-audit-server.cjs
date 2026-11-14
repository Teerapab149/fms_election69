// scripts/audit/start-audit-server.cjs — `next dev` wired to the audit's own
// throwaway database, for the repro-http-*.mjs scripts. Started through
// .claude/launch.json ("fms-audit") or by hand:
//
//   AUDIT_DATABASE_URL=postgresql://.../<name>_e2e node scripts/audit/start-audit-server.cjs
//
// Nothing here can reach a real database: auditUrl() refuses any host that is
// not local and any database whose name does not end in _e2e / _test, and that
// value REPLACES DATABASE_URL for the child process. Its own build folder
// (.next-audit.local, gitignored) keeps it from disturbing a dev server.
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");

process.env.AUDIT_DATABASE_URL ||= "postgresql://postgres:audit-local-only@127.0.0.1:54329/fms_audit_e2e";
const { auditUrl, loadState } = require("./lib/auditDb.cjs");
const state = loadState();
const PORT = process.env.AUDIT_PORT || "3210";

const env = {
  ...process.env,
  DATABASE_URL: auditUrl(),
  NEXT_DIST_DIR: ".next-audit.local",
  NEXTAUTH_URL: `http://localhost:${PORT}`,
  // root deploy, like production: empty beats whatever a local .env says
  BASE_PATH: "", NEXT_PUBLIC_BASE_PATH: "", ASSET_PREFIX: "",
  ELECTION_BALLOT_PUBLIC_KEY: state.publicKey.replace(/\n/g, "\\n"),
  BALLOT_CHAIN_SECRET: state.chainSecret,
  NEXTAUTH_SECRET: process.env.AUDIT_NEXTAUTH_SECRET || crypto.createHash("sha256").update("audit-nextauth" + state.chainSecret).digest("hex"),
  ADMIN_JWT_SECRET: crypto.createHash("sha256").update("audit-admin-jwt" + state.chainSecret).digest("hex"),
  ADMIN_TEST_TOOLS: "",
};
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", PORT], { env, stdio: "inherit" });
child.on("exit", (c) => process.exit(c ?? 0));
for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => child.kill());
