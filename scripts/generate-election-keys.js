// scripts/generate-election-keys.js — v2-SEC key ceremony helper.
//
//   node scripts/generate-election-keys.js
//
// Prints a fresh RSA-2048 keypair + a chain secret to STDOUT only. It writes
// NOTHING to disk and NOTHING into the repo — the private key must never touch
// the server or version control.
//
// Key ceremony (once per election year):
//   1. Run this on an offline / trusted machine.
//   2. PRIVATE KEY  → printed on paper, split-custody between two people on the
//      faculty side (e.g. the staff member operating the system + the advisor).
//      It is needed ONLY to settle a dispute (offline decrypt-recount). Losing
//      it loses dispute-recount, NOT the election result (the tally is
//      Candidate.score, kept server-side).
//   3. PUBLIC KEY    → set as ELECTION_BALLOT_PUBLIC_KEY on the server (env).
//   4. CHAIN SECRET  → set as BALLOT_CHAIN_SECRET on the server (env). Keep a
//      copy off-box; export the chain head periodically so tampering that also
//      forges the chain is still catchable against the external record.
//
// The server needs ONLY the public key + chain secret. It can never read a
// ballot back.

const crypto = require("node:crypto");

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

// Single-line, \n-escaped form ready to paste into a .env value.
const esc = (pem) => pem.trim().replace(/\r?\n/g, "\\n");
const chainSecret = crypto.randomBytes(32).toString("hex");

const line = "=".repeat(72);
process.stdout.write(`
${line}
  ELECTION BALLOT KEY CEREMONY — output is printed ONCE, never stored
${line}

--- PRIVATE KEY — พิมพ์ลงกระดาษ เก็บ offline เท่านั้น ห้ามขึ้นเซิร์ฟเวอร์ ----------

${privateKey.trim()}

--- PUBLIC KEY (ตัวเดียวกับใน .env ด้านล่าง — ไม่ต้องจดซ้ำ) -------------------

${publicKey.trim()}

--- วาง 2 บรรทัดนี้ลง .env ของเซิร์ฟเวอร์ (แล้วจบขั้นตอนฝั่งเซิร์ฟเวอร์) ----------

ELECTION_BALLOT_PUBLIC_KEY="${esc(publicKey)}"
BALLOT_CHAIN_SECRET="${chainSecret}"

${line}
  สรุป: 1) พิมพ์ PRIVATE KEY ลงกระดาษ แบ่งเก็บ 2 คนฝั่งคณะ (เจ้าหน้าที่ + อาจารย์)
       2) วาง 2 บรรทัดบนลง .env   3) จด BALLOT_CHAIN_SECRET สำรองนอกเครื่อง
       4) ปิดหน้าต่างนี้ — ระบบไม่เก็บอะไรไว้เลย รันใหม่ได้ค่าใหม่เสมอ
${line}
`);
