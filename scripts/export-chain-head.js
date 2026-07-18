// scripts/export-chain-head.js — print the chain tip for off-box archival.
//
//   node scripts/export-chain-head.js
//   node scripts/export-chain-head.js >> /some/offline/chain-head.log
//
// Emits ONE line: ISO timestamp + head hash + seq. Run it on a cron (or by hand)
// at intervals and keep the output OFF the DB server. That external record is
// what makes tampering that ALSO forges the internal chain still catchable: a
// later verify whose recomputed head disagrees with an earlier exported head
// proves history was rewritten. The head hash reveals nothing about any ballot.

const { loadEnv } = require("./lib/loadEnv");
loadEnv();

const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const head = await db.chainHead.findUnique({ where: { id: 1 } });
  const ballots = await db.ballot.count();
  const ts = new Date().toISOString();
  if (!head) {
    console.log(`${ts}\tNO_CHAIN_HEAD\tseq=?\tballots=${ballots}`);
    process.exitCode = 1;
    return;
  }
  console.log(`${ts}\thead=${head.head}\tseq=${head.seq}\tballots=${ballots}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
