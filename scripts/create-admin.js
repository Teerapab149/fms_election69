// scripts/create-admin.js — provision THE admin account.
//
//   node scripts/create-admin.js                       create with a generated password
//   node scripts/create-admin.js --rotate              keep the account, new password
//   node scripts/create-admin.js --username someone    a different username
//   node scripts/create-admin.js --out admin.enc       also save it to an encrypted file
//   node scripts/create-admin.js --list                who currently has admin
//
// One account, one password, no roles to manage. The password is generated here,
// shown ONCE, and stored only as a bcrypt hash — it is not in this file, not in
// .env, not in git, and not recoverable from the database. Lose it and you rotate;
// there is nothing to look up.
//
// This replaces the ADMIN_PASSWORD_AUTH_EXTRA bootstrap for day-to-day use. That
// path still exists in /api/admin/login for an account with no hash yet, and its
// quirk is worth knowing: the password it expects is "<email>+<secret>", not the
// secret on its own, and it does nothing once a hash is set. Both facts cost an
// hour to rediscover, which is most of why this script exists.
//
// The login route accepts the username as either an email or a studentId, so the
// row is created with studentId = the username. isAdmin=true is the only thing it
// checks for access.

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const { loadEnv } = require("./lib/loadEnv");
loadEnv();
const { PrismaClient } = require("@prisma/client");

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const argOf = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };

const USERNAME = argOf("--username") || "fmsadminstaff";
const EMAIL = argOf("--email") || `${USERNAME}@fms.psu.ac.th`;
const NAME = argOf("--name") || "FMS Election Admin";
const OUT = argOf("--out");
const line = "=".repeat(72);

// Password: 20 chars from an unambiguous alphabet (no O/0, l/1/I) because this gets
// read off a screen and typed by hand. ~103 bits of entropy, well past anything the
// login route's rate limit would let an attacker try.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
function generatePassword(len = 20) {
  const out = [];
  while (out.length < len) {
    // rejection sampling — modulo on random bytes would bias the early letters
    for (const b of crypto.randomBytes(len)) {
      if (b < 256 - (256 % ALPHABET.length)) out.push(ALPHABET[b % ALPHABET.length]);
      if (out.length === len) break;
    }
  }
  return out.join("");
}

// Same envelope format as generate-election-keys.js so there is one thing to learn.
const KDF = { N: 1 << 15, r: 8, p: 1, keylen: 32 };
function seal(obj, passphrase) {
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(passphrase, salt, KDF.keylen, { N: KDF.N, r: KDF.r, p: KDF.p, maxmem: 256 * 1024 * 1024 });
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  return { format: "fms-admin-credentials/1", cipher: "aes-256-gcm", kdf: { name: "scrypt", ...KDF },
    salt: salt.toString("base64"), iv: iv.toString("base64"), tag: c.getAuthTag().toString("base64"), data: body.toString("base64") };
}

(async () => {
  const db = new PrismaClient();
  try {
    if (has("--list")) {
      const admins = await db.user.findMany({ where: { isAdmin: true }, select: { studentId: true, email: true, name: true, role: true, passwordHash: true } });
      console.log(`\nบัญชีที่มีสิทธิ์แอดมินตอนนี้: ${admins.length}\n`);
      admins.forEach((a) => console.log(`  ${String(a.studentId).padEnd(20)} ${String(a.email || "-").padEnd(34)} ${a.role.padEnd(8)} ${a.passwordHash ? "ตั้งรหัสแล้ว" : "ยังไม่ตั้งรหัส"}  ${a.name || ""}`));
      console.log("");
      return;
    }

    const existing = await db.user.findUnique({ where: { studentId: USERNAME } });
    if (existing && !has("--rotate")) {
      console.error(`\nมีบัญชี "${USERNAME}" อยู่แล้ว\n  ถ้าต้องการตั้งรหัสผ่านใหม่ให้บัญชีเดิม ใช้:  node scripts/create-admin.js --rotate\n  ถ้าต้องการบัญชีชื่ออื่น ใช้:  node scripts/create-admin.js --username <ชื่อ>\n`);
      process.exitCode = 1;
      return;
    }

    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.upsert({
      where: { studentId: USERNAME },
      update: { passwordHash, isAdmin: true, role: "ADMIN", email: EMAIL, name: NAME },
      create: {
        studentId: USERNAME, email: EMAIL, name: NAME,
        role: "ADMIN", isAdmin: true, passwordHash,
        // deliberately not a voter: no year means the /api/vote eligibility check
        // (ปี 1-4) rejects this account, so the admin login can never cast a ballot
        year: null, isVoted: false, isFormCompleted: false,
      },
    });

    if (OUT) {
      if (fs.existsSync(OUT)) { console.error(`มีไฟล์ ${OUT} อยู่แล้ว — ยกเลิก`); process.exitCode = 1; return; }
      const pass = process.env.KEY_PASSPHRASE;
      if (!pass || pass.length < 8) { console.error("ต้องตั้ง KEY_PASSPHRASE (อย่างน้อย 8 ตัว) ก่อนใช้ --out"); process.exitCode = 1; return; }
      fs.writeFileSync(OUT, JSON.stringify(seal({ username: USERNAME, password, createdAt: new Date().toISOString() }, pass), null, 2) + "\n", { mode: 0o600 });
    }

    // "one admin account" is the intent, so say plainly when it is not true yet.
    // Demoting someone is not something a create script should do behind your back.
    const others = await db.user.findMany({ where: { isAdmin: true, NOT: { studentId: USERNAME } }, select: { studentId: true, name: true } });
    if (others.length && has("--only")) {
      await db.user.updateMany({ where: { isAdmin: true, NOT: { studentId: USERNAME } }, data: { isAdmin: false, role: "student" } });
    }

    console.log(`
${line}
  ${has("--rotate") ? "ตั้งรหัสผ่านใหม่แล้ว" : "สร้างบัญชีแอดมินแล้ว"} — แสดงรหัสผ่านครั้งเดียว
${line}

    เข้าที่      /fms-ovs/admin/login
    Username    ${USERNAME}
    Password    ${password}

${line}
  รหัสผ่านนี้เก็บในฐานข้อมูลเป็น bcrypt hash เท่านั้น — ไม่มีที่ไหนเก็บตัวจริงไว้
  เปิดดูย้อนหลังไม่ได้ ถ้าลืมให้รัน --rotate เพื่อออกรหัสใหม่
${OUT ? `\n  บันทึกลงไฟล์เข้ารหัสแล้ว: ${path.resolve(OUT)}\n` : "\n  เก็บลงตัวจัดการรหัสผ่านตอนนี้เลย แล้วปิดหน้าต่างนี้\n"}${
  others.length
    ? (has("--only")
        ? `  ถอดสิทธิ์แอดมินของอีก ${others.length} บัญชีแล้ว: ${others.map((o) => o.studentId).join(", ")}\n`
        : `  ⚠ ยังมีบัญชีอื่นที่เป็นแอดมินอยู่อีก ${others.length}: ${others.map((o) => o.studentId).join(", ")}\n    ถ้าต้องการให้เหลือบัญชีเดียวจริง ๆ ให้รันซ้ำด้วย --only\n`)
    : ""}${line}
`);
  } finally {
    await db.$disconnect();
  }
})();
