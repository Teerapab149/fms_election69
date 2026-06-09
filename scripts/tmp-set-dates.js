// temp dev helper: merge election date keys into SystemConfig.globalConfig to verify
// dates-to-admin end-to-end. usage: node scripts/tmp-set-dates.js set|clear
const fs = require("fs"), path = require("path");
const { PrismaClient } = require("@prisma/client");
function re(f){const o={};try{for(const l of fs.readFileSync(path.join(process.cwd(),f),"utf8").split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);if(m)o[m[1]]=m[2].replace(/^["']|["']$/g,"");}}catch{}return o;}
(async () => {
  const e = { ...re(".env"), ...re(".env.local") };
  if (e.DATABASE_URL) process.env.DATABASE_URL = e.DATABASE_URL;
  const db = new PrismaClient();
  const row = await db.systemConfig.findFirst({ where: { id: 1 }, select: { globalConfig: true } });
  const gc = { ...(row?.globalConfig || {}) };
  if (process.argv[2] === "clear") {
    delete gc.campaignStartAt; delete gc.electionStartAt; delete gc.electionEndAt;
  } else {
    gc.electionStartAt = "2026-02-06T08:30";  // past → election already started
    gc.electionEndAt = "2026-12-31T17:00";    // FUTURE → countdown should show real time
  }
  await db.systemConfig.update({ where: { id: 1 }, data: { globalConfig: gc } });
  console.log("globalConfig dates:", { campaignStartAt: gc.campaignStartAt, electionStartAt: gc.electionStartAt, electionEndAt: gc.electionEndAt });
  await db.$disconnect();
})();
