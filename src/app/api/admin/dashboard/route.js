import { db } from "../../../../lib/db";
import crypto from "crypto";
import { NextResponse } from "next/server";

const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY
  ? process.env.ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
  : null;

function verifyAdminToken(request) {
  const encryptedToken = request.headers.get('x-admin-token');
  const now = Date.now();

  if (!encryptedToken) { // Added Log
    console.error("verifyAdminToken: Missing x-admin-token header");
    return NextResponse.json({ error: "Missing x-admin-token header" }, { status: 401 });
  }
  if (!PRIVATE_KEY) { // Added Log
    console.error("verifyAdminToken: Missing PRIVATE_KEY in env");
    return NextResponse.json({ error: "Missing ADMIN_PRIVATE_KEY in Server Environment" }, { status: 401 });
  }

  try {
    const buffer = Buffer.from(encryptedToken, "base64");
    const decryptedData = crypto.privateDecrypt(
      {
        key: PRIVATE_KEY,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer
    );

    const decryptedString = decryptedData.toString("utf8");
    const [secret, timestamp] = decryptedString.split('|');
    const EXPECTED_SECRET = process.env.ADMIN_AUTH_SECRET || "fallback_secret";

    if (secret !== EXPECTED_SECRET) {
      console.error(`verifyAdminToken: Secret Mismatch. Got: '${secret}', Expected: '${EXPECTED_SECRET}'`);
      return NextResponse.json({ error: "Invalid Token" }, { status: 403 });
    }

    if (now - parseInt(timestamp) > 3600000) {
      console.error(`verifyAdminToken: Token Expired. Diff: ${now - parseInt(timestamp)}ms`);
      return NextResponse.json({ error: "Token Expired" }, { status: 403 });
    }

    return null;

  } catch (decryptionError) {
    console.error("verifyAdminToken: Decryption failed:", decryptionError.message);
    return NextResponse.json({ error: "Invalid Token Format" }, { status: 403 });
  }
}


// 1. GET: ดึงข้อมูลสรุป (Dashboard Stats)
export async function GET(req) {
  const authError = verifyAdminToken(req);
  if (authError) return authError;
  try {
    // ดึงจำนวนคนทั้งหมด / คนที่โหวตแล้ว
    const validYears = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
    const totalEligible = await db.user.count({ where: { year: { in: validYears } } });
    const totalVoters = await db.user.count({ where: { year: { in: validYears } } });
    const votedCount = await db.user.count({ where: { isVoted: true, year: { in: validYears } } });

    // ดึงสถานะระบบ (เปิด/ปิด)
    let config = await db.systemConfig.findFirst();
    if (!config) {
      config = await db.systemConfig.create({ data: { isVoteOpen: true } });
    }

    // ดึงคะแนนผู้สมัคร (เรียงตามเบอร์)
    const candidates = await db.candidate.findMany({
      orderBy: { number: 'asc' }
    });

    return NextResponse.json({
      stats: {
        totalVoters,
        votedCount,
        turnout: totalVoters > 0 ? ((votedCount / totalVoters) * 100).toFixed(2) : 0,
        isVoteOpen: config.isVoteOpen,
        showResult: config.showResult,
        systemMode: config.systemMode || "AUTO",
        googleFormUrl: config.googleFormUrl || ""
      },
      candidates
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

// 2. POST: สั่งการระบบ (Action)
export async function POST(req) {
  const authError = verifyAdminToken(req);
  if (authError) return authError;
  try {
    const body = await req.json();
    const { action, mode } = body;

    // กรณี: เปลี่ยนโหมดระบบ (AUTO, PAUSE, ENDED)
    if (action === 'SET_MODE') {
      const validModes = ["AUTO", "PAUSE", "ENDED", "MANUAL_OPEN"];

      if (!validModes.includes(mode)) {
        return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
      }

      const config = await db.systemConfig.findFirst();
      await db.systemConfig.update({
        where: { id: config.id },
        data: { systemMode: mode }
      });
      return NextResponse.json({ message: "Success" });
    }

    // กรณี: สลับเปิด/ปิด การแสดงผล
    if (action === 'TOGGLE_SHOW_RESULT') {
      const config = await db.systemConfig.findFirst();
      await db.systemConfig.update({
        where: { id: config.id },
        data: { showResult: !config.showResult }
      });
      return NextResponse.json({ message: "Success" });
    }

    // กรณี: อัปเดตลิงก์ Google Form
    if (action === 'SET_GOOGLE_FORM') {
      const { url } = body;
      let config = await db.systemConfig.findFirst();

      // ✅ Fix: หากยังไม่มี Config ให้สร้างใหม่ (ป้องกัน Crash)
      if (!config) {
        config = await db.systemConfig.create({
          data: {
            systemMode: "AUTO",
            isVoteOpen: false,
            showResult: false
          }
        });
      }

      await db.systemConfig.update({
        where: { id: config.id },
        data: { googleFormUrl: url || "" } // ป้องกัน undefined
      });
      return NextResponse.json({ message: "Success" });
    }

    // กรณี: ล้างคะแนนทั้งหมด (Reset) 
    if (action === 'RESET_VOTES') {
      const validYears = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
      // 1. รีเซ็ต User ให้กลับเป็นยังไม่โหวต (เฉพาะนักศึกษาปี 1-4)
      await db.user.updateMany({
        where: { year: { in: validYears } },
        data: { isVoted: false, candidateId: null }
      });
      // 2. รีเซ็ตคะแนนผู้สมัครเป็น 0
      await db.candidate.updateMany({
        data: { score: 0 }
      });
      return NextResponse.json({ success: true, message: "Reset votes successfully for eligible students (Year 1-4)" });
    }

    // กรณี: ล้างข้อมูลพรรคทั้งหมด (Reset Candidates) 
    if (action === 'RESET_CANDIDATES') {
      const validYears = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
      await db.candidate.updateMany({
        data: { score: 0 }
      });
      // Also clear candidateId from users
      await db.user.updateMany({
        where: { year: { in: validYears } },
        data: { candidateId: null }
      });
      await db.member.deleteMany({});
      await db.candidate.deleteMany({});
      const newCandidate = await db.candidate.create({
        data: { name: "งดออกเสียง", number: 0, slogan: null, logoUrl: null, groupImageUrls: null }
      });
      return NextResponse.json({ message: "Database Reset Successful" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Action Error:", error); // Debugging
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}