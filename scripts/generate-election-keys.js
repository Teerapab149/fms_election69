// scripts/generate-election-keys.js — v2-SEC key ceremony helper.
//
//   node scripts/generate-election-keys.js                       print to screen only
//   node scripts/generate-election-keys.js --out key-2569.enc    save an encrypted file
//   node scripts/generate-election-keys.js --decrypt key-2569.enc  read it back later
//
// Generates a fresh RSA-2048 keypair + a chain secret. The server needs ONLY the
// public key and the chain secret; it can never read a ballot back.
//
// WHY THE PRIVATE KEY MUST NOT LIVE ON THE SERVER
// The Ballot table stores no voter id, so decrypting the box on its own yields
// only the multiset of choices — which is the published tally anyway. The danger
// is the pair: ballots are appended in time order (seq) and User.votedAt records
// each voter's own time, so anyone holding BOTH a database copy AND the private
// key can line the two orderings up and attach a name to every ballot. Keeping
// the key off the server is what stops that, and it is the only thing that does.
//
// KEY CEREMONY (once per election year)
//   1. Run this on a machine you trust, ideally offline.
//   2. PRIVATE KEY + CHAIN SECRET → --out writes them into one file encrypted
//      with a passphrase (AES-256-GCM, scrypt). Keep the file in two places you
//      control — a USB stick and your own password manager, say — and NEVER on
//      the election server, in the repo, or in the same backup as the database.
//      Split custody without paper: give the file to one person and the
//      passphrase to another, and neither can open it alone.
//   3. PUBLIC KEY   → ELECTION_BALLOT_PUBLIC_KEY on the server (env).
//   4. CHAIN SECRET → BALLOT_CHAIN_SECRET on the server (env). The copy in the
//      encrypted file is the backup; export the chain head periodically so
//      tampering that also forges the chain stays catchable.
//
// Losing the private key loses the ability to settle a dispute by recount. It
// does NOT lose the election result — the tally is Candidate.score, server-side.

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

const argv = process.argv.slice(2);
const argOf = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
const outPath = argOf("--out");
const decPath = argOf("--decrypt");

// ── passphrase input ────────────────────────────────────────────────────────
// KEY_PASSPHRASE lets this be scripted/tested; otherwise prompt with the echo
// muted so the passphrase does not end up in a screen recording or scrollback.
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const onData = (ch) => {
      // reprint the prompt without the typed characters
      if (["\n", "\r", ""].includes(String(ch))) return;
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(question);
    };
    process.stdin.on("data", onData);
    rl.question(question, (answer) => { process.stdin.off("data", onData); rl.close(); process.stdout.write("\n"); resolve(answer); });
  });
}
async function getPassphrase({ confirm }) {
  if (process.env.KEY_PASSPHRASE) return process.env.KEY_PASSPHRASE;
  const a = await askHidden("ตั้งรหัสผ่านสำหรับไฟล์กุญแจ: ");
  if (!a || a.length < 8) { console.error("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร"); process.exit(1); }
  if (confirm) {
    const b = await askHidden("พิมพ์รหัสผ่านอีกครั้ง: ");
    if (a !== b) { console.error("รหัสผ่านไม่ตรงกัน — ยังไม่ได้เขียนไฟล์ใดๆ"); process.exit(1); }
  }
  return a;
}

// ── envelope format ─────────────────────────────────────────────────────────
// Self-describing on purpose: every parameter needed to decrypt is in the file,
// so a future maintainer can open it with standard tools even without this repo.
const KDF = { N: 1 << 15, r: 8, p: 1, keylen: 32 };
function seal(plaintextObj, passphrase) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(passphrase, salt, KDF.keylen, { N: KDF.N, r: KDF.r, p: KDF.p, maxmem: 256 * 1024 * 1024 });
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([c.update(JSON.stringify(plaintextObj), "utf8"), c.final()]);
  return {
    format: "fms-election-key/1",
    cipher: "aes-256-gcm",
    kdf: { name: "scrypt", ...KDF },
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: c.getAuthTag().toString("base64"),
    data: body.toString("base64"),
  };
}
function open(envelope, passphrase) {
  const kdf = envelope.kdf || KDF;
  const key = crypto.scryptSync(passphrase, Buffer.from(envelope.salt, "base64"), kdf.keylen || 32,
    { N: kdf.N, r: kdf.r, p: kdf.p, maxmem: 256 * 1024 * 1024 });
  const d = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.iv, "base64"));
  d.setAuthTag(Buffer.from(envelope.tag, "base64"));
  return JSON.parse(Buffer.concat([d.update(Buffer.from(envelope.data, "base64")), d.final()]).toString("utf8"));
}

const line = "=".repeat(72);

// ── --decrypt: read a sealed file back ──────────────────────────────────────
if (decPath) {
  (async () => {
    let envelope;
    try { envelope = JSON.parse(fs.readFileSync(decPath, "utf8")); }
    catch (e) { console.error(`อ่านไฟล์ไม่ได้: ${decPath}\n${e.message}`); process.exit(1); }
    const pass = await getPassphrase({ confirm: false });
    let payload;
    try { payload = open(envelope, pass); }
    catch { console.error("เปิดไฟล์ไม่สำเร็จ — รหัสผ่านผิด หรือไฟล์ถูกแก้ไข"); process.exit(1); }
    process.stdout.write(`
${line}
  ไฟล์กุญแจของการเลือกตั้ง ${payload.electionYear || "(ไม่ระบุปี)"} · สร้างเมื่อ ${payload.createdAt}
${line}

--- PRIVATE KEY (ใช้กับ scripts/decrypt-recount.js เท่านั้น) ---------------------

${payload.privateKey.trim()}

--- BALLOT_CHAIN_SECRET (สำเนาสำรองของค่าที่อยู่บนเซิร์ฟเวอร์) --------------------

${payload.chainSecret}

${line}
  วิธีใช้กับการนับซ้ำ: บันทึก PRIVATE KEY ข้างบนลงไฟล์ชั่วคราวนอก repo
  แล้วรัน  node scripts/decrypt-recount.js --key <path ของไฟล์นั้น>  จากนั้นลบไฟล์ทิ้ง
${line}
`);
  })();
} else {
  // ── generate ──────────────────────────────────────────────────────────────
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  // Single-line, \n-escaped form ready to paste into a .env value.
  const esc = (pem) => pem.trim().replace(/\r?\n/g, "\\n");
  const chainSecret = crypto.randomBytes(32).toString("hex");
  const envLines = `ELECTION_BALLOT_PUBLIC_KEY="${esc(publicKey)}"\nBALLOT_CHAIN_SECRET="${chainSecret}"`;

  (async () => {
    if (outPath) {
      if (fs.existsSync(outPath)) { console.error(`มีไฟล์ ${outPath} อยู่แล้ว — ยกเลิกเพื่อไม่ให้ทับกุญแจเดิม`); process.exit(1); }
      const pass = await getPassphrase({ confirm: true });
      const sealed = seal({
        electionYear: process.env.ELECTION_YEAR || null,
        createdAt: new Date().toISOString(),
        privateKey: privateKey.trim(),
        publicKey: publicKey.trim(),
        chainSecret,
        note: "เปิดด้วย: node scripts/generate-election-keys.js --decrypt <ไฟล์นี้>",
      }, pass);
      fs.writeFileSync(outPath, JSON.stringify(sealed, null, 2) + "\n", { mode: 0o600 });
      process.stdout.write(`
${line}
  เขียนไฟล์กุญแจแล้ว (เข้ารหัส AES-256-GCM ด้วยรหัสผ่านที่คุณตั้ง)
${line}

  ไฟล์: ${path.resolve(outPath)}

  ในไฟล์มี PRIVATE KEY + CHAIN SECRET · เปิดได้ด้วย
      node scripts/generate-election-keys.js --decrypt ${outPath}

--- วาง 2 บรรทัดนี้ลง .env ของเซิร์ฟเวอร์ (แค่นี้ฝั่งเซิร์ฟเวอร์ก็จบ) --------------

${envLines}

${line}
  ต่อไป: 1) ก๊อปไฟล์นี้ไปเก็บ 2 ที่ที่คุณคุมเอง (เช่น USB + ตัวจัดการรหัสผ่าน)
        2) อย่าเก็บไว้บนเซิร์ฟเวอร์ ใน repo หรือในชุดสำรองเดียวกับฐานข้อมูล
        3) อยากแยกความรับผิดชอบ: ให้ไฟล์คนหนึ่ง บอกรหัสผ่านอีกคนหนึ่ง
        4) ลบไฟล์ต้นทางออกจากเครื่องที่ใช้สร้าง เมื่อก๊อปครบแล้ว
${line}
`);
    } else {
      process.stdout.write(`
${line}
  ELECTION BALLOT KEY CEREMONY — แสดงบนจอครั้งเดียว ไม่ได้เขียนไฟล์ใดๆ
${line}

--- PRIVATE KEY — เก็บ offline เท่านั้น ห้ามขึ้นเซิร์ฟเวอร์ ----------------------

${privateKey.trim()}

--- PUBLIC KEY (ตัวเดียวกับใน .env ด้านล่าง — ไม่ต้องจดซ้ำ) -------------------

${publicKey.trim()}

--- วาง 2 บรรทัดนี้ลง .env ของเซิร์ฟเวอร์ ----------------------------------------

${envLines}

${line}
  อยากได้เป็นไฟล์เข้ารหัสแทนการจดเอง ให้รันใหม่ด้วย
      node scripts/generate-election-keys.js --out key-<ปี>.enc
${line}
`);
    }
  })();
}
