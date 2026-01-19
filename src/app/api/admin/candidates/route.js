import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

// ✅ 1. ลำดับตำแหน่ง (ต้องตรงกับ Frontend เป๊ะๆ)
const PREDEFINED_POSITIONS = [
  "นายกสโมสรนักศึกษา",
  "อุปนายกกิจการภายใน",
  "อุปนายกกิจการภายนอก",
  "เลขานุการ",
  "เหรัญญิก",
  "ประธานฝ่ายประชาสัมพันธ์",
  "ประธานฝ่ายสวัสดิการ",
  "ประธานฝ่ายพัสดุ",
  "ประธานฝ่ายกีฬา",
  "ประธานฝ่ายวิชาการ",
  "ประธานฝ่ายศิลปวัฒนธรรม",
  "ประธานฝ่ายข้อมูลกิจการนักศึกษา",
  "ประธานฝ่ายเทคโนโลยีสารสนเทศ",
  "ประธานฝ่ายประเมินผล",
  "ประธานฝ่ายกิจกรรม",
  "ประธานฝ่ายกราฟิกดีไซน์",
  "ประธานฝ่ายพิธีการ",
  "ประธานฝ่ายครีเอทีฟและสันทนาการ",
  "ประธานฝ่ายสถานที่",
  "ประธานฝ่ายสาธารณสุข"
];

function getPositionNumber(positionName) {
  const index = PREDEFINED_POSITIONS.indexOf(positionName);
  return index !== -1 ? index + 1 : 999;
}

// Upload Logo พรรค
async function uploadLogo(file, candidateName) {
  if (file && typeof file !== "string") {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = candidateName.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, "");
    const fileName = `${safeName}_${Date.now()}.jpg`;
    const uploadDir = path.join(process.cwd(), "public/images/candidates/logo");

    if (!fs.existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);

    return `/images/candidates/logo/${fileName}`;
  }
  return null;
}

// ✅ Upload รูปสมาชิก (Member)
async function processMemberImage(memberData, formData, partyNumber) {
  const file = formData.get(`member_file_${memberData.studentId}`);
  const positionNum = getPositionNumber(memberData.position);

  // ถ้ามีไฟล์ใหม่ส่งมา
  if (file && typeof file !== "string") {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ตั้งชื่อไฟล์ตามลำดับ: {positionNum}.jpg
    const fileName = `${positionNum}.jpg`;
    const folderName = `party_${partyNumber}`;
    const uploadDir = path.join(process.cwd(), `public/images/members/${folderName}`);

    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    await writeFile(path.join(uploadDir, fileName), buffer);
    return `/images/members/${folderName}/${fileName}`;
  }

  return memberData.existingImageUrl || "";
}

// --- PUT (Update) ---
export async function PUT(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const formData = await req.formData();
    const name = formData.get("name");
    const number = parseInt(formData.get("number"));
    const slogan = formData.get("slogan");
    const logoMeaning = formData.get("logoMeaning");
    const file = formData.get("file");

    // รับ JSON สมาชิก
    const membersJson = formData.get("members");
    const rawMembers = membersJson ? JSON.parse(membersJson) : [];

    // 1. จัดการ Logo
    const newLogoUrl = await uploadLogo(file, name);

    // 2. จัดการรูปสมาชิก (Upload & Get Path)
    const membersDataToCreate = await Promise.all(rawMembers.map(async (m) => {
      const imageUrl = await processMemberImage(m, formData, number);
      return {
        name: m.name,
        studentId: m.studentId,
        position: m.position,
        imageUrl: imageUrl,
      };
    }));

    // 3. Transaction (ลบเก่า -> สร้างใหม่)
    const updatedCandidate = await db.$transaction(async (tx) => {
      await tx.member.deleteMany({ where: { candidateId: parseInt(id) } });

      const candidate = await tx.candidate.update({
        where: { id: parseInt(id) },
        data: {
          name,
          number,
          slogan,
          logoMeaning,
          ...(newLogoUrl && { logoUrl: newLogoUrl }),
          members: {
            create: membersDataToCreate
          }
        },
        include: { members: true }
      });
      return candidate;
    });

    return NextResponse.json(updatedCandidate);

  } catch (error) {
    console.error("🔥 Error:", error);
    if (error.code === 'P2002') return NextResponse.json({ error: "เลขพรรคหรือรหัสนักศึกษาซ้ำ" }, { status: 400 });
    return NextResponse.json({ error: "Failed to update", detail: error }, { status: 500 });
  }
}

// --- POST (Create) ---
export async function POST(req) {
  try {
    const formData = await req.formData();
    const name = formData.get("name");
    const number = parseInt(formData.get("number"));
    const slogan = formData.get("slogan");
    const logoMeaning = formData.get("logoMeaning");
    const file = formData.get("file");

    const membersJson = formData.get("members");
    const rawMembers = membersJson ? JSON.parse(membersJson) : [];

    const logoUrl = await uploadLogo(file, name);

    const membersDataToCreate = await Promise.all(rawMembers.map(async (m) => {
      const imageUrl = await processMemberImage(m, formData, number);
      return {
        name: m.name,
        studentId: m.studentId,
        position: m.position,
        imageUrl: imageUrl,
      };
    }));

    const newCandidate = await db.candidate.create({
      data: {
        name,
        number,
        slogan,
        logoUrl,
        logoMeaning,
        score: 0,
        members: {
          create: membersDataToCreate
        }
      },
      include: { members: true }
    });

    return NextResponse.json(newCandidate);

  } catch (error) {
    console.error("🔥 Error:", error);
    if (error.code === 'P2002') return NextResponse.json({ error: "เลขพรรคหรือรหัสนักศึกษาซ้ำ" }, { status: 400 });
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function DELETE(req) {
  let target_id = null;
  try {
    const { searchParams } = new URL(req.url);
    target_id = parseInt(searchParams.get("id"));
    if (!target_id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { candidateId: target_id },
        data: {
          isVoted: false,
          candidateId: null
        }
      });

      await tx.member.deleteMany({
        where: { candidateId: target_id }
      });

      await tx.candidate.delete({
        where: { id: target_id }
      });
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete", details: error.message, candidate_id: target_id }, { status: 500 });
  }
}