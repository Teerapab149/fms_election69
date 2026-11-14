// scripts/audit/repro-03-audit-log-coverage.mjs
//
//   node scripts/audit/repro-03-audit-log-coverage.mjs
//
// Static check, no database. README says the admin audit log records every
// command. This lists every admin API route file that exports a state-changing
// handler (POST / PUT / PATCH / DELETE) and whether that file ever writes an
// AdminAuditLog row. A route marked "NO" changes data with no audit trail.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(process.cwd(), "src", "app", "api", "admin");
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (n === "route.js") files.push(p);
  }
})(root);

let gaps = 0;
console.log("route".padEnd(52), "mutating handlers".padEnd(22), "writes AdminAuditLog");
for (const f of files.sort()) {
  const src = readFileSync(f, "utf8");
  const methods = ["POST", "PUT", "PATCH", "DELETE"].filter((m) =>
    new RegExp(`export\\s+async\\s+function\\s+${m}\\b`).test(src));
  if (!methods.length) continue;
  // a direct insert, or the shared helpers in src/lib/audit/adminAudit.js
  const logs = /adminAuditLog\.create|\baudited\(|\bwriteAudit\(/.test(src);
  if (!logs) gaps += 1;
  console.log(
    relative(process.cwd(), f).replace(/\\/g, "/").replace("src/app", "").replace("/route.js", "").padEnd(52),
    methods.join(",").padEnd(22),
    logs ? "yes" : "NO",
  );
}
console.log(`\n${gaps} state-changing admin route file(s) never write an audit row.`);
