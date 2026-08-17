// scripts/admin.js — everything about who can get into /admin.
//
//   node scripts/admin.js --list                    ใครเป็นแอดมินตอนนี้
//   node scripts/admin.js --grant 6610510149        ให้สิทธิ์แอดมิน
//   node scripts/admin.js --revoke 6610510149       ถอดสิทธิ์ (มีผลทันที)
//   node scripts/admin.js --rotate-password         ออกรหัสกลางใหม่ แสดงครั้งเดียว
//   node scripts/admin.js --break-glass             บัญชีสำรอง มีรหัสของตัวเอง
//
// The model, in one paragraph: WHO is a row in User with isAdmin=true, and only
// this script writes that flag — signing in with PSU SSO never grants or removes
// it. WHAT proves it at the login form is one shared password for the whole
// committee, stored as a single bcrypt hash in SystemConfig. So the password on
// its own opens nothing (your studentId must also be flagged), and the flag on
// its own opens nothing (you must also know the password). Revoking is instant:
// every admin API call re-reads the flag.
//
// The plaintext password exists only in this process's memory and on the screen
// once. It is not written to .env, not to a file, not to git, and cannot be read
// back out of the database. Forgetting it means --rotate-password, not recovery.
// It is never accepted as a command-line argument either — argv lands in shell
// history and in `ps` output for every user on the box.

const bcrypt = require("bcryptjs");
const { loadEnv } = require("./lib/loadEnv");
const { generatePassword } = require("./lib/password");
loadEnv();
const { PrismaClient } = require("@prisma/client");

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const argOf = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };
const line = "=".repeat(72);

/** Accept either a studentId or an email, the same as the login form does. */
function whereFor(idOrEmail) {
  const v = String(idOrEmail).trim();
  return v.includes("@") ? { email: v.toLowerCase() } : { studentId: v };
}

function banner(title, rows, footer) {
  console.log(`\n${line}\n  ${title}\n${line}\n`);
  for (const [k, v] of rows) console.log(`    ${String(k).padEnd(11)} ${v}`);
  console.log(`\n${line}`);
  if (footer) console.log(footer);
  console.log("");
}

async function list(db) {
  const admins = await db.user.findMany({
    where: { isAdmin: true },
    select: { studentId: true, name: true, email: true, role: true, passwordHash: true },
    orderBy: { studentId: "asc" },
  });
  const cfg = await db.systemConfig.findFirst({ where: { id: 1 }, select: { adminPasswordHash: true, updatedAt: true } });

  console.log(`\nแอดมินตอนนี้: ${admins.length} คน`);
  for (const a of admins) {
    const own = a.passwordHash ? " · มีรหัสของตัวเอง" : "";
    console.log(`  ${String(a.studentId).padEnd(18)} ${String(a.name || "-").padEnd(28)} ${String(a.role).padEnd(8)}${own}`);
  }
  console.log(
    cfg?.adminPasswordHash
      ? `\nรหัสกลาง: ตั้งไว้แล้ว (แก้ล่าสุด ${cfg.updatedAt?.toISOString?.() || "-"})`
      : `\nรหัสกลาง: ⚠ ยังไม่ได้ตั้ง — ไม่มีใครล็อกอินได้ ให้รัน --rotate-password`
  );
  console.log("");
}

async function grant(db, target) {
  const user = await db.user.findFirst({ where: whereFor(target) });
  if (!user) {
    console.error(`\nไม่พบ "${target}" ในฐานข้อมูล`);
    console.error("  แอดมินต้องเป็นคนที่มีข้อมูลอยู่แล้ว — ให้เขาล็อกอิน PSU SSO หนึ่งครั้ง");
    console.error("  หรือตรวจว่านำเข้ารายชื่อนักศึกษาแล้ว จากนั้นรันคำสั่งนี้ซ้ำ\n");
    process.exitCode = 1;
    return;
  }
  if (user.isAdmin) {
    console.log(`\n${user.studentId} (${user.name || "-"}) เป็นแอดมินอยู่แล้ว\n`);
    return;
  }
  await db.user.update({ where: { id: user.id }, data: { isAdmin: true } });
  banner("ให้สิทธิ์แอดมินแล้ว", [
    ["Username", user.studentId],
    ["ชื่อ", user.name || "-"],
  ], "  เขาล็อกอินที่ /admin/login ด้วยรหัส นศ. ตัวเอง + รหัสกลาง\n  ยังไม่รู้รหัสกลาง? ออกใหม่ด้วย --rotate-password (รหัสเดิมจะใช้ไม่ได้ทั้งชุด)");
}

async function revoke(db, target) {
  const user = await db.user.findFirst({ where: whereFor(target) });
  if (!user) {
    console.error(`\nไม่พบ "${target}" ในฐานข้อมูล\n`);
    process.exitCode = 1;
    return;
  }
  if (!user.isAdmin) {
    console.log(`\n${user.studentId} ไม่ได้เป็นแอดมินอยู่แล้ว\n`);
    return;
  }
  await db.user.update({
    where: { id: user.id },
    // ล้างรหัสประจำบัญชีทิ้งด้วย — ถ้าคนนี้เคยเป็นบัญชีสำรอง รหัสนั้นต้องตายไปพร้อมสิทธิ์
    data: { isAdmin: false, passwordHash: null },
  });
  const left = await db.user.count({ where: { isAdmin: true } });
  banner("ถอดสิทธิ์แอดมินแล้ว", [
    ["Username", user.studentId],
    ["ชื่อ", user.name || "-"],
    ["เหลือแอดมิน", `${left} คน`],
  ], "  มีผลทันทีกับ request ถัดไปของเขา ไม่ต้องรอ token หมดอายุ\n  ถ้าเขารู้รหัสกลาง ให้เปลี่ยนรหัสกลางด้วย: --rotate-password");
}

async function rotatePassword(db) {
  const password = generatePassword();
  const hash = await bcrypt.hash(password, 12);

  const existing = await db.systemConfig.findFirst({ where: { id: 1 }, select: { id: true } });
  if (existing) {
    await db.systemConfig.update({ where: { id: 1 }, data: { adminPasswordHash: hash } });
  } else {
    await db.systemConfig.create({ data: { id: 1, adminPasswordHash: hash } });
  }

  const admins = await db.user.count({ where: { isAdmin: true } });
  const personal = await db.user.count({ where: { isAdmin: true, passwordHash: { not: null } } });
  banner("รหัสกลางใหม่ — แสดงครั้งเดียว", [
    ["เข้าที่", "/admin/login"],
    ["Username", "รหัส นศ. ของแต่ละคน"],
    ["Password", password],
  ], `  ใช้ได้กับแอดมิน ${admins} คนที่ตั้งไว้ (ดูรายชื่อด้วย --list)\n` +
     "  รหัสเดิมใช้ไม่ได้แล้วตั้งแต่วินาทีนี้ · เก็บลงตัวจัดการรหัสผ่านก่อนปิดหน้าต่าง\n" +
     "  ในฐานข้อมูลมีแต่ bcrypt hash — เปิดดูย้อนหลังไม่ได้ ลืมแล้วรันคำสั่งนี้ใหม่" +
     (personal
       ? `\n\n  ⚠ มีแอดมิน ${personal} บัญชีที่ยังมีรหัสของตัวเองอยู่ — รหัสนั้นยังใช้ล็อกอินได้\n` +
         "    อยู่เฉพาะบัญชีสำรองเท่านั้นถึงจะถูก ถ้าเป็นบัญชีนักศึกษาให้ล้างด้วย --clear-personal"
       : ""));
}

// รหัสประจำบัญชีควรมีเฉพาะบัญชีสำรอง — ที่ติดมากับบัญชีนักศึกษาคือของเก่าจาก seed
// ซึ่งรหัสตัวจริงเคยถูก commit ลง repo สาธารณะ (ลบออกแล้ว 2026-07-28 แต่ยังอยู่ใน
// git history) เท่ากับเป็นรหัสที่ใครก็อ่านได้ ต้องล้างทิ้งให้เหลือแต่รหัสกลาง
async function clearPersonal(db) {
  const rows = await db.user.findMany({
    where: { passwordHash: { not: null } },
    select: { id: true, studentId: true, name: true },
  });
  if (!rows.length) {
    console.log("\nไม่มีบัญชีไหนมีรหัสของตัวเอง — เหลือแต่รหัสกลางอยู่แล้ว\n");
    return;
  }
  await db.user.updateMany({ where: { passwordHash: { not: null } }, data: { passwordHash: null } });
  banner(`ล้างรหัสประจำบัญชีแล้ว ${rows.length} บัญชี`,
    rows.map((r) => [r.studentId, r.name || "-"]),
    "  ทุกคนใช้รหัสกลางทางเดียว · ถ้าต้องการบัญชีสำรองที่มีรหัสของตัวเอง ให้สร้างใหม่ด้วย --break-glass");
}

// บัญชีทางหนีไฟ: ไม่ผูกกับนักศึกษาคนไหน มีรหัสของตัวเองแยกจากรหัสกลาง ใช้ตอนที่
// รหัสกลางหาย/กรรมการล็อกอินไม่ได้ · year=null โดยตั้งใจ → ด่านตรวจสิทธิ์ ปี 1-4
// ใน /api/vote ปฏิเสธบัญชีนี้ ลงคะแนนไม่ได้แม้จะมีสิทธิ์แอดมินเต็ม
async function breakGlass(db) {
  const username = argOf("--username") || "fmsadminstaff";
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.upsert({
    where: { studentId: username },
    update: { passwordHash, isAdmin: true, role: "ADMIN" },
    create: {
      studentId: username,
      email: `${username}@fms.psu.ac.th`,
      name: "FMS Election Admin (สำรอง)",
      role: "ADMIN",
      isAdmin: true,
      passwordHash,
      year: null,
      isVoted: false,
      isFormCompleted: false,
    },
  });

  banner("บัญชีสำรอง — แสดงรหัสครั้งเดียว", [
    ["เข้าที่", "/admin/login"],
    ["Username", username],
    ["Password", password],
  ], "  รหัสนี้เป็นของบัญชีนี้บัญชีเดียว ไม่ใช่รหัสกลาง และไม่ควรบอกใครนอกจากผู้ดูแล\n" +
     "  บัญชีนี้ลงคะแนนไม่ได้โดยตั้งใจ (ไม่มีชั้นปี) · ปิดการใช้งานด้วย --revoke " + username);
}

// A permanent admin account for faculty staff, who are not in the student roll
// and may not be able to reach PSU SSO for this app at all. Without this the
// only ways in were --grant (needs a row SSO created first) and --break-glass
// (the emergency hatch, meant to be revoked after use), so the person who should
// certify a result had no ordinary account to do it from.
//
// Unlike --break-glass this account signs in with the SHARED committee password,
// exactly like every other admin. What it gets instead is an identity: a real
// name, recorded, so certifying a result signs it with a person.
//
// year stays null on purpose — the same guard that stops --break-glass voting
// keeps this account out of /api/vote and out of every turnout count.
async function askPassword() {
  const readline = require("node:readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const ask = (q) => new Promise((res) => rl.question(q, res));
  try {
    console.log("\n  รหัสจะแสดงบนจอขณะพิมพ์ เพื่อให้เห็นว่าพิมพ์ถูก — ดูให้แน่ใจว่าไม่มีใครอยู่ข้างหลัง\n");
    const a = await ask("ตั้งรหัสผ่านของบัญชีนี้: ");
    if (!a || a.length < 8) { console.error("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร"); process.exit(1); }
    const b = await ask("พิมพ์อีกครั้ง: ");
    if (a !== b) { console.error("รหัสผ่านไม่ตรงกัน — ยังไม่ได้สร้างบัญชีใดๆ"); process.exit(1); }
    return a;
  } finally {
    rl.close();
  }
}

async function createStaff(db, username) {
  const name = argOf("--name");
  if (!username || username.startsWith("--")) {
    console.log("\nต้องระบุ username · เช่น  node scripts/admin.js --create-staff anuwat.s --name \"อนุวัฒน์ นามสกุล\"\n");
    process.exitCode = 1;
    return;
  }
  if (!name) {
    console.log(`\nต้องระบุ --name ด้วย เพราะชื่อนี้จะถูกใช้เป็นผู้รับรองผลการเลือกตั้ง
  เช่น  node scripts/admin.js --create-staff ${username} --name "อนุวัฒน์ นามสกุล"\n`);
    process.exitCode = 1;
    return;
  }

  const email = argOf("--email") || `${username}@psu.ac.th`;
  const existing = await db.user.findUnique({ where: { studentId: username } });
  if (existing && existing.year) {
    console.log(`\n"${username}" มีอยู่แล้วและเป็นนักศึกษา (ชั้นปี ${existing.year})
  บัญชีเจ้าหน้าที่ต้องไม่มีชั้นปี ไม่งั้นจะถูกนับเป็นผู้มีสิทธิ์เลือกตั้ง
  ถ้าต้องการให้คนนี้เป็นแอดมิน ใช้  --grant ${username}  แทน\n`);
    process.exitCode = 1;
    return;
  }

  // Its own password, not the shared committee one — this is the account that
  // signs a certified result, so the shared password must not be able to produce
  // that signature. --ask-password to choose one; otherwise a generated one is
  // shown once. Never taken from argv (see the header).
  const chosen = has("--ask-password");
  const password = chosen ? await askPassword() : generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.upsert({
    where: { studentId: username },
    update: { name, email, isAdmin: true, role: "STAFF", passwordHash },
    create: {
      studentId: username,
      email,
      name,
      role: "STAFF",
      isAdmin: true,
      passwordHash,
      year: null,
      isVoted: false,
      isFormCompleted: false,
    },
  });

  banner(existing ? "อัปเดตบัญชีเจ้าหน้าที่แล้ว" : "สร้างบัญชีเจ้าหน้าที่แล้ว", [
    ["เข้าที่", "/admin/login"],
    ["Username", username],
    ["หรืออีเมล", email],
    ["ชื่อ", name],
    ["Password", chosen ? "รหัสที่คุณเพิ่งตั้ง" : password],
  ], "  รหัสนี้เป็นของบัญชีนี้บัญชีเดียว · รหัสกลางของกรรมการเปิดบัญชีนี้ไม่ได้\n" +
     "  บัญชีนี้ลงคะแนนไม่ได้และไม่ถูกนับเป็นผู้มีสิทธิ์เลือกตั้ง (ไม่มีชั้นปี)\n" +
     "  ชื่อข้างบนจะถูกบันทึกเป็นผู้รับรองผล เมื่อกดรับรองผลในหน้าแอดมิน\n" +
     "  ถอดสิทธิ์ด้วย  --revoke " + username);
}

(async () => {
  const db = new PrismaClient();
  try {
    if (has("--create-staff")) return await createStaff(db, argOf("--create-staff"));
    if (has("--list")) return await list(db);
    if (has("--grant")) return await grant(db, argOf("--grant"));
    if (has("--revoke")) return await revoke(db, argOf("--revoke"));
    if (has("--rotate-password")) return await rotatePassword(db);
    if (has("--clear-personal")) return await clearPersonal(db);
    if (has("--break-glass")) return await breakGlass(db);

    console.log(`
จัดการสิทธิ์แอดมิน — เลือกหนึ่งคำสั่ง

  --list                  ใครเป็นแอดมินตอนนี้ + รหัสกลางตั้งไว้หรือยัง
  --grant <รหัส นศ.>       ให้สิทธิ์แอดมิน (รับ email ก็ได้)
  --revoke <รหัส นศ.>      ถอดสิทธิ์ มีผลกับ request ถัดไปทันที
  --create-staff <ชื่อผู้ใช้> --name "<ชื่อจริง>"
                          บัญชีเจ้าหน้าที่คณะ ใช้รหัสกลางเหมือนแอดมินคนอื่น
                          ลงคะแนนไม่ได้ · ชื่อจริงใช้เป็นผู้รับรองผล
  --rotate-password       ออกรหัสกลางใหม่ แสดงครั้งเดียว รหัสเดิมตายทันที
  --clear-personal        ล้างรหัสประจำบัญชีทุกบัญชี ให้เหลือแต่รหัสกลาง
  --break-glass           บัญชีสำรองที่มีรหัสของตัวเอง (--username เปลี่ยนชื่อได้)
                          ใช้ตอนฉุกเฉินเท่านั้น ถอดทิ้งเมื่อแก้ปัญหาเสร็จ

ล็อกอินต้องมีครบสองอย่าง: ชื่อผู้ใช้ที่ถูกให้สิทธิ์ไว้ + รหัสกลาง
`);
  } finally {
    await db.$disconnect();
  }
})();
