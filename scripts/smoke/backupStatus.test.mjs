// describeBackupStatus — the "สำรองข้อมูลอัตโนมัติ (backup)" readiness check.
// Inputs are the raw contents of backups/status/LAST_OK and LAST_FAIL exactly as
// scripts/backup.sh writes them (null = file missing, "" = unreadable).
import { test } from "node:test";
import assert from "node:assert/strict";
import { describeBackupStatus as describe } from "../../src/lib/election/backupStatus.mjs";

const H = 3600e3;
const NOW = Date.parse("2027-02-09T06:00:00Z");
const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
const fmt = (d) => `@${d.toISOString()}`;

const okLine = (ageH, extra = {}) =>
  JSON.stringify({ at: iso(NOW - ageH * H), run: "20270209-060000", file: "db-20270209-060000.sql.gz", tables: 12, images: "images-x.tar.gz", interval_hours: 6, ...extra });
const failLine = (ageH, stage = "dump", reason = "pg_dump ไม่สำเร็จ") =>
  JSON.stringify({ at: iso(NOW - ageH * H), run: "r", stage, reason, interval_hours: 6 });

const run = (lastOk, lastFail) => describe({ lastOk, lastFail, now: NOW, formatWhen: fmt });
// detail = plain Thai for the committee, techDetail = what IT needs; some checks look at both
const all = (r) => `${r.detail} ${r.techDetail || ""}`;

test("no history at all: warn, says DBA-managed backups can ignore it", () => {
  const r = run(null, null);
  assert.equal(r.level, "warn");
  assert.match(r.detail, /ยังไม่พบประวัติการสำรองข้อมูลอัตโนมัติ/);
  assert.match(r.detail, /เจ้าหน้าที่ IT/);
  assert.match(r.detail, /DBA/);
  assert.match(r.detail, /ข้ามได้/);
});

test("no history: advice is scheduler-neutral (every run mode named, README pointed to)", () => {
  const r = run(null, null);
  for (const hint of [/docker compose logs backup/, /journalctl -u fms-backup/, /pm2 logs fms-backup/, /cron/, /deploy\/backup\/README\.md/, /BACKUP_STATUS_DIR/]) {
    assert.match(r.techDetail, hint);
  }
  assert.doesNotMatch(r.detail, /docker|journalctl|pm2|cron|BACKUP_STATUS_DIR/);
});

test("runner recorded by backup.sh: shown on pass, and late/stale advice names only that runner's log", () => {
  const pass = run(okLine(1, { runner: "cron" }), null);
  assert.equal(pass.level, "pass");
  assert.match(pass.techDetail, /ตัวรัน cron/);

  const late = run(okLine(8, { runner: "systemd" }), null);
  assert.equal(late.level, "warn");
  assert.match(late.techDetail, /journalctl -u fms-backup/);
  assert.doesNotMatch(all(late), /docker compose|pm2 logs/);

  const stale = run(okLine(20, { runner: "pm2" }), null);
  assert.equal(stale.level, "fail");
  assert.match(stale.techDetail, /pm2 logs fms-backup/);
  assert.doesNotMatch(all(stale), /docker compose|journalctl/);

  const dock = run(okLine(8, { runner: "docker" }), null);
  assert.match(dock.techDetail, /docker compose logs backup/);
});

test("unknown or hostile runner value is ignored: generic advice, nothing echoed", () => {
  const r = run(okLine(8, { runner: "<script>alert(1)</script>" }), null);
  assert.equal(r.level, "warn");
  assert.match(r.techDetail, /deploy\/backup\/README\.md/);
  assert.doesNotMatch(all(r), /script/);
  // records written before the runner field existed keep working and get the generic advice
  const old = run(okLine(8), null);
  assert.match(old.techDetail, /deploy\/backup\/README\.md/);
  assert.doesNotMatch(all(old), /ตัวรัน/);
});

test("level logic is independent of the runner field", () => {
  for (const runner of ["docker", "cron", "systemd", "pm2", "loop", "manual", "weird"]) {
    assert.equal(run(okLine(2, { runner }), null).level, "pass");
    assert.equal(run(okLine(8, { runner }), null).level, "warn");
    assert.equal(run(okLine(20, { runner }), null).level, "fail");
    assert.equal(run(okLine(5, { runner }), failLine(1)).level, "fail");
  }
});

test("fresh OK: pass with time, age and file name", () => {
  const r = run(okLine(2), null);
  assert.equal(r.level, "pass");
  assert.match(r.detail, /@2027-02-09T04:00:00\.000Z/);
  assert.match(r.detail, /2 ชม\. ที่แล้ว/);
  assert.match(r.techDetail, /db-20270209-060000\.sql\.gz/);
});

test("OK right at interval + 1h is still pass; just past it is warn (late)", () => {
  assert.equal(run(okLine(7), null).level, "pass");
  const r = run(okLine(7.1), null);
  assert.equal(r.level, "warn");
  assert.match(r.detail, /เลยรอบ/);
});

test("OK older than 2 x interval + 1h: fail (stale)", () => {
  assert.equal(run(okLine(13), null).level, "warn");
  const r = run(okLine(13.5), null);
  assert.equal(r.level, "fail");
  assert.match(r.detail, /เก่าเกิน 2 รอบ/);
});

test("interval_hours missing (manual/cron run) falls back to 24h", () => {
  assert.equal(run(okLine(20, { interval_hours: null }), null).level, "pass");
  assert.equal(run(okLine(30, { interval_hours: null }), null).level, "warn");
  assert.equal(run(okLine(50, { interval_hours: null }), null).level, "fail");
});

test("OK older than the last FAIL is ignored for fail: newest record wins", () => {
  // failure 3h ago, success 1h ago → pass
  assert.equal(run(okLine(1), failLine(3)).level, "pass");
});

test("FAIL newer than OK: fail with reason, fail time and last good backup time", () => {
  const r = run(okLine(5), failLine(1, "dump", "pg_dump ไม่สำเร็จ (รหัสผ่านผิด)"));
  assert.equal(r.level, "fail");
  assert.match(r.detail, /ล้มเหลว/);
  assert.match(r.techDetail, /สาเหตุ: pg_dump ไม่สำเร็จ \(รหัสผ่านผิด\)/);
  assert.match(r.detail, /@2027-02-09T05:00:00\.000Z/); // failed run
  assert.match(r.detail, /สำรองข้อมูลสำเร็จครั้งล่าสุด @2027-02-09T01:00:00\.000Z/); // last good
});

test("FAIL and never an OK: fail, says there was never a good backup", () => {
  const r = run(null, failLine(1));
  assert.equal(r.level, "fail");
  assert.match(r.detail, /ยังไม่เคยมีการสำรองข้อมูลที่สำเร็จ/);
});

test("offsite copy failed but local backup fresh: warn, not fail", () => {
  const r = run(okLine(0.1), failLine(0.05, "offsite", "BACKUP_AFTER_CMD ไม่สำเร็จ (exit 1)"));
  assert.equal(r.level, "warn");
  assert.match(r.detail, /คัดลอกสำเนาออกนอกเครื่อง/);
  assert.match(r.detail, /สำเนาในเครื่องยังใช้ได้/);
  assert.match(r.techDetail, /exit 1/);
});

test("offsite failure stamped the same second as its LAST_OK is still reported", () => {
  // real backup.sh output: both files carry the identical second-resolution `at`
  const at = iso(NOW - 0.5 * H);
  const ok = JSON.stringify({ at, run: "r1", file: "db-r1.sql.gz", interval_hours: 6 });
  const fail = JSON.stringify({ at, run: "r1", stage: "offsite", reason: "BACKUP_AFTER_CMD ไม่สำเร็จ (exit 3)", interval_hours: 6 });
  const r = run(ok, fail);
  assert.equal(r.level, "warn");
  assert.match(r.techDetail, /exit 3/);
});

test("offsite failed AND local backup stale: fail", () => {
  assert.equal(run(okLine(20), failLine(19, "offsite")).level, "fail");
});

test("bad JSON / empty (unreadable) status files are treated as missing and named", () => {
  const r = run("{not json", "");
  assert.equal(r.level, "warn");
  assert.match(r.detail, /อ่านบันทึกผลการสำรองข้อมูลไม่ได้/);
  assert.match(r.techDetail, /อ่านไฟล์สถานะไม่ได้: LAST_OK, LAST_FAIL/);
  const r2 = run(JSON.stringify({ at: "yesterday" }), null);
  assert.equal(r2.level, "warn");
  assert.match(r2.techDetail, /LAST_OK/);
  // good FAIL next to a corrupt OK: still reports the failure
  const r3 = run("garbage", failLine(1));
  assert.equal(r3.level, "fail");
  assert.match(r3.techDetail, /อ่านไฟล์สถานะไม่ได้: LAST_OK/);
});

test("file field never leaks a path, only the base name", () => {
  const r = run(okLine(1, { file: "/srv/secret/dir/db-1.sql.gz" }), null);
  assert.match(r.techDetail, /ไฟล์ db-1\.sql\.gz/);
  assert.doesNotMatch(all(r), /srv\/secret/);
});

test("built-in formatter works without injection and has no middle dot", () => {
  const r = describe({ lastOk: okLine(1), lastFail: null, now: new Date(NOW) });
  assert.equal(r.level, "pass");
  assert.match(r.detail, /9\/02\/2570 เวลา 12\.00 น\./);
  for (const x of [r, run(null, null), run(okLine(5), failLine(1)), run(okLine(0.1), failLine(0.05, "offsite"))]) {
    assert.ok(!x.detail.includes("·"), x.detail);
  }
});
