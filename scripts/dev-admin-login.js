/**
 * scripts/dev-admin-login.js — DEV-ONLY admin login helper.
 *
 * Why: every session the assistant used to ask the human to log into /admin by
 * hand. Everything needed is already on disk in .env.local (gitignored), so
 * there is no reason to ask. This script finds an admin user in the DB, performs
 * the real /api/admin/login call against the dev server, and prints the result.
 *
 * Needs ADMIN_DEV_PASSWORD in .env.local = the shared password this dev database
 * currently holds. Get one with:
 *     node scripts/admin.js --rotate-password
 * then paste it in as ADMIN_DEV_PASSWORD. That file is gitignored; the real
 * deployment's password must never be put there.
 *
 * NO SECRET IS HARDCODED HERE — it is read from .env.local at runtime, so this
 * file is safe to commit. Never paste a password value into a committed file.
 *
 * Usage:
 *   node scripts/dev-admin-login.js                # log in, confirm, save cookie
 *   node scripts/dev-admin-login.js --show         # also print the credentials
 *                                                  # (for pasting into the browser)
 * Output:
 *   - prints whether login succeeded
 *   - writes the admin_token cookie to .dev-admin-token.local (gitignored) so
 *     curl-style API checks can reuse it
 *   - with --show, prints username + password so you can do the same login in
 *     the preview browser (which is the path the editor E2E needs)
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

function readEnv(file) {
  const out = {};
  try {
    const txt = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return out;
}

(async () => {
  const env = { ...readEnv(".env"), ...readEnv(".env.local") };
  const password = process.env.ADMIN_DEV_PASSWORD || env.ADMIN_DEV_PASSWORD;
  if (!password) {
    console.error("ERROR: ADMIN_DEV_PASSWORD not found in .env.local");
    console.error("  run:  node scripts/admin.js --rotate-password");
    console.error("  then: add ADMIN_DEV_PASSWORD=<the password it printed> to .env.local");
    process.exit(1);
  }
  const basePath = env.NEXT_PUBLIC_BASE_PATH || env.BASE_PATH || "";
  const port = process.env.PORT || 3000;
  const base = `http://localhost:${port}${basePath}`;

  const prisma = new PrismaClient();
  try {
    const admin = await prisma.user.findFirst({
      where: { isAdmin: true, email: { not: null } },
      select: { studentId: true, email: true, name: true },
    });
    if (!admin) {
      console.error("ERROR: no isAdmin user with an email found in the DB");
      process.exitCode = 1;
      return;
    }
    const email = String(admin.email).toLowerCase();
    const username = admin.studentId || email;

    const res = await fetch(`${base}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    console.log(`Login ${res.status} ${res.ok ? "OK" : "FAILED"} — ${data.message || ""} (admin: ${admin.name || username})`);

    if (res.ok) {
      const setCookie = res.headers.get("set-cookie") || "";
      const token = (setCookie.match(/admin_token=([^;]+)/) || [])[1];
      if (token) {
        fs.writeFileSync(path.join(process.cwd(), ".dev-admin-token.local"), token);
        console.log("Saved admin_token → .dev-admin-token.local (gitignored)");
      }
    }
    if (process.argv.includes("--show")) {
      console.log("\n--- for the preview browser login fetch ---");
      console.log("username:", username);
      console.log("password:", password);
    }
    process.exitCode = res.ok ? 0 : 2;
  } catch (e) {
    console.error("ERROR:", e.message);
    process.exitCode = 1;
  } finally {
    // Let Prisma close its handles before the process exits — calling
    // process.exit() here races libuv on Windows (async.c assertion).
    await prisma.$disconnect();
  }
})();
