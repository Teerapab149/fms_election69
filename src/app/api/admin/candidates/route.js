import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import crypto from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY
  ? process.env.ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
  : null;

function verifyAdminToken(request) {
  const encryptedToken = request.headers.get('x-admin-token');
  const now = Date.now();

  if (!encryptedToken || !PRIVATE_KEY) {
    return NextResponse.json({ error: "Unauthorized / Config Error" }, { status: 401 });
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
      return NextResponse.json({ error: "Invalid Token" }, { status: 403 });
    }

    if (now - parseInt(timestamp) > 3600000) {
      return NextResponse.json({ error: "Token Expired" }, { status: 403 });
    }

    return null;

  } catch (decryptionError) {
    console.error("Decryption failed:", decryptionError);
    return NextResponse.json({ error: "Invalid Token Format" }, { status: 403 });
  }
}

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

function textToJsonArray(text) {
  if (!text || text.trim() === "") return [];
  return text.split('\n').map(line => line.trim()).filter(line => line !== "");
}

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

// Helper: Upload Official Image (NEW ✅)
async function uploadOfficialImage(file, candidateName) {
  if (file && typeof file !== "string") {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = candidateName.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, "");
    // ตั้งชื่อไฟล์นำหน้าด้วย OFFICIAL เพื่อให้แยกง่าย
    const fileName = `OFFICIAL_${safeName}_${Date.now()}.jpg`;
    const uploadDir = path.join(process.cwd(), "public/images/candidates/official");

    if (!fs.existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);

    return `/images/candidates/official/${fileName}`;
  }
  return null;
}

async function uploadMultipleGroupImages(files, candidateName, candidateId) {
  if (!files || files.length === 0) return [];

  const uploadedUrls = [];
  const uploadDir = path.join(process.cwd(), `public/images/candidates/groupimage/party${candidateId}`);
  if (!fs.existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file && typeof file !== "string") {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = candidateName.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, "");

      const fileName = `GROUP_${safeName}_${Date.now()}_${i}.jpg`;

      await writeFile(path.join(uploadDir, fileName), buffer);
      uploadedUrls.push(`/images/candidates/groupimage/party${candidateId}/${fileName}`);
    }
  }
  return uploadedUrls;
}

async function processMemberImage(memberData, formData, partyNumber, existingImagesMap = new Map()) {
  const file = formData.get(`member_file_${memberData.studentId}`);
  const positionNum = getPositionNumber(memberData.position);

  if (file && typeof file !== "string") {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${positionNum}.jpg`;
    const folderName = `party_${partyNumber}`;
    const uploadDir = path.join(process.cwd(), `public/images/members/${folderName}`);

    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    await writeFile(path.join(uploadDir, fileName), buffer);
    return `/images/members/${folderName}/${fileName}`;
  }

  if (memberData.existingImageUrl && memberData.existingImageUrl !== "") {
    return memberData.existingImageUrl;
  }

  if (existingImagesMap.has(memberData.studentId)) {
    return existingImagesMap.get(memberData.studentId);
  }

  return "";
}

// --- PUT (Update) ---
export async function PUT(req) {
  const authError = verifyAdminToken(req);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const formData = await req.formData();

    const dataToUpdate = {};

    if (formData.has("name")) dataToUpdate.name = formData.get("name");
    if (formData.has("number")) dataToUpdate.number = parseInt(formData.get("number"));
    if (formData.has("slogan")) dataToUpdate.slogan = formData.get("slogan");
    if (formData.has("logoMeaning")) dataToUpdate.logoMeaning = formData.get("logoMeaning");

    if (formData.has("missions")) {
      dataToUpdate.missions = textToJsonArray(formData.get("missions"));
    }
    if (formData.has("policies")) {
      dataToUpdate.policies = textToJsonArray(formData.get("policies"));
    }

    const file = formData.get("file");
    if (file) {
      const currentName = dataToUpdate.name || "candidate_update";
      const newLogoUrl = await uploadLogo(file, currentName);
      if (newLogoUrl) dataToUpdate.logoUrl = newLogoUrl;
    }

    // --- Update Official Image (NEW ✅) ---
    const officialFile = formData.get("officialImage"); // ต้องตรงกับชื่อ field ใน frontend
    if (officialFile) {
      const currentName = dataToUpdate.name || "candidate_update";
      const newOfficialUrl = await uploadOfficialImage(officialFile, currentName);
      if (newOfficialUrl) dataToUpdate.officialImageUrl = newOfficialUrl;
    }

    const existingGroupImagesJson = formData.get("existingGroupImages");
    let finalGroupImages = [];

    if (existingGroupImagesJson !== null) {
      try {
        finalGroupImages = JSON.parse(existingGroupImagesJson);
        if (!Array.isArray(finalGroupImages)) finalGroupImages = [];
      } catch (e) {
        finalGroupImages = [];
      }
    } else {
      const existingCandidate = await db.candidate.findUnique({
        where: { id: parseInt(id) },
        select: { groupImageUrls: true }
      });

      let dbImages = existingCandidate?.groupImageUrls || [];
      if (!Array.isArray(dbImages)) dbImages = dbImages ? [dbImages] : [];
      finalGroupImages = dbImages;
    }

    const groupFiles = formData.getAll("groupFiles");
    const validGroupFiles = groupFiles.filter(f => f && typeof f !== "string");

    if (validGroupFiles.length > 0) {
      const currentName = dataToUpdate.name || "candidate_update";
      const newUrls = await uploadMultipleGroupImages(validGroupFiles, currentName, id);

      finalGroupImages = [...finalGroupImages, ...newUrls];
    }

    if (validGroupFiles.length > 0 || existingGroupImagesJson !== null) {
      dataToUpdate.groupImageUrls = finalGroupImages;
    }

    const membersJson = formData.get("members");

    const updatedCandidate = await db.$transaction(async (tx) => {

      if (membersJson) {
        const rawMembers = JSON.parse(membersJson);

        let partyNumber = dataToUpdate.number;
        if (!partyNumber) {
          const existingCandidate = await tx.candidate.findUnique({
            where: { id: parseInt(id) },
            select: { number: true }
          });
          partyNumber = existingCandidate.number;
        }

        const currentMembers = await tx.member.findMany({
          where: { candidateId: parseInt(id) },
          select: { studentId: true, imageUrl: true }
        });
        const currentMemberImages = new Map(currentMembers.map(m => [m.studentId, m.imageUrl]));

        const membersDataToCreate = await Promise.all(rawMembers.map(async (m) => {
          const imageUrl = await processMemberImage(m, formData, partyNumber, currentMemberImages);
          return {
            name: m.name,
            studentId: m.studentId,
            position: m.position,
            imageUrl: imageUrl,
          };
        }));

        await tx.member.deleteMany({ where: { candidateId: parseInt(id) } });

        dataToUpdate.members = {
          create: membersDataToCreate
        };
      }

      const candidate = await tx.candidate.update({
        where: { id: parseInt(id) },
        data: dataToUpdate,
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
  const authError = verifyAdminToken(req);
  if (authError) return authError;
  try {
    const formData = await req.formData();
    const name = formData.get("name");
    const number = parseInt(formData.get("number"));
    const slogan = formData.get("slogan");
    const logoMeaning = formData.get("logoMeaning");
    const file = formData.get("file");
    const missions = textToJsonArray(formData.get("missions"));
    const policies = textToJsonArray(formData.get("policies"));
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

    let newCandidate = await db.candidate.create({
      data: {
        name,
        number,
        slogan,
        logoUrl,
        officialImageUrl,
        groupImageUrls: [],
        logoMeaning,
        missions,
        policies,
        score: 0,
        members: {
          create: membersDataToCreate
        }
      },
      include: { members: true }
    });

    const groupFiles = formData.getAll("groupFiles");
    const validGroupFiles = groupFiles.filter(f => f && typeof f !== "string");

    if (validGroupFiles.length > 0) {
      const groupImageUrls = await uploadMultipleGroupImages(validGroupFiles, name, newCandidate.id);

      newCandidate = await db.candidate.update({
        where: { id: newCandidate.id },
        data: { groupImageUrls: groupImageUrls },
        include: { members: true }
      });
    }

    return NextResponse.json(newCandidate);

  } catch (error) {
    console.error("🔥 Error:", error);
    if (error.code === 'P2002') return NextResponse.json({ error: "เลขพรรคหรือรหัสนักศึกษาซ้ำ" }, { status: 400 });
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const authError = verifyAdminToken(req);
  if (authError) return authError;
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