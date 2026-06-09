// temp dev helper: toggle a mock user's isVoted so the /vote page can be live-verified.
// usage: node scripts/tmp-vote.js <studentId> <true|false>
const fs = require("fs"), path = require("path");
const { PrismaClient } = require("@prisma/client");
function re(f) { const o = {}; try { for (const l of fs.readFileSync(path.join(process.cwd(), f), "utf8").split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) o[m[1]] = m[2].replace(/^["']|["']$/g, ""); } } catch {} return o; }
(async () => {
  const e = { ...re(".env"), ...re(".env.local") };
  if (e.DATABASE_URL) process.env.DATABASE_URL = e.DATABASE_URL;
  const db = new PrismaClient();
  const sid = process.argv[2] || "6610510149";
  const voted = process.argv[3] === "true";
  const u = await db.user.update({ where: { studentId: sid }, data: { isVoted: voted } });
  console.log("set", sid, "isVoted=", u.isVoted);
  await db.$disconnect();
})();
