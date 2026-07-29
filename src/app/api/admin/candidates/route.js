import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { optimizeImage } from "../../../../lib/imageOptimize";
import { adminGuard } from "../../../../lib/auth/adminCheck";
import { writeFile, mkdir, unlink, rmdir, readdir } from "fs/promises";
import path from "path";
import fs from "fs";

/**
 * ลบ folder ถ้ามันว่างเปล่า
 */
async function removeEmptyDir(dirPath) {
  try {
    const files = await readdir(dirPath);
    if (files.length === 0) {
      await rmdir(dirPath);
      console.log(`🗑️ Removed empty directory: ${dirPath}`);
    }
  } catch (error) {
    // Ignore error
  }
}

/**
 * ลบไฟล์รูปจาก public folder
 * @param {string} imageUrl - URL ของรูป เช่น /images/candidates/groupimage/party1/xxx.jpg
 */
async function deleteImageFile(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return;

  try {
    // แปลง URL เป็น file path
    const filePath = path.join(process.cwd(), 'public', imageUrl);

    // เช็คว่าไฟล์มีอยู่จริงก่อนลบ
    if (fs.existsSync(filePath)) {
      await unlink(filePath);
      console.log(`🗑️ Deleted file: ${imageUrl}`);

      // ลองลบ parent folder ถ้ามันว่าง
      await removeEmptyDir(path.dirname(filePath));
    }
  } catch (error) {
    console.error(`❌ Failed to delete file ${imageUrl}:`, error.message);
  }
}

/**
 * ลบไฟล์รูปหลายไฟล์
 * @param {string[]} imageUrls - Array ของ URL รูป
 */
async function deleteMultipleImageFiles(imageUrls) {
  if (!Array.isArray(imageUrls)) return;

  for (const url of imageUrls) {
    await deleteImageFile(url);
  }
}


function getPositionPriority(position) {
  if (!position) return 999;
  const p = position.trim();

  // 1. นายก... (President)
  if (p.startsWith("นายก")) return 1;

  // 2. อุปนายก... (Vice President) - รวมถึง "อุปนายกฝ่าย..."
  if (p.startsWith("อุปนายก")) return 2;

  // 3. Department Heads (Starts with "ประธาน") -> Priority 4 (Last)
  if (p.startsWith("ประธาน")) return 4;

  // 4. Unique Leaders (Secretary, Treasurer, etc.) -> Priority 3
  // พวกที่ไม่ได้ขึ้นต้นด้วย ประธาน (เช่น เลขานุการ, เหรัญญิก)
  return 3;
}

function getPositionNumber(positionName) {
  // Return priority group as base, plus a hash or simple mapped index to differentiate within group if needed
  // For now, we just want to sort by category. 
  // But wait, the previous logic returned specific indexes 1-20.
  // We should try to preserve specific order for known unique positions if possible, 
  // but adhere to the categories.

  const priority = getPositionPriority(positionName);

  // Refine sorted value: Priority * 100 + Sub-index
  // 100-199: President
  // 200-299: VP
  // 300-399: Unique Execs
  // 400+: Department Heads

  if (priority === 1) return 1; // นายก
  if (priority === 2) {
    if (positionName.includes("ภายใน")) return 201;
    if (positionName.includes("ภายนอก")) return 202;
    return 299;
  }
  if (priority === 3) {
    // Common unique roles
    if (positionName.includes("เลขา")) return 301;
    if (positionName.includes("เหรัญญิก")) return 302;
    return 399;
  }
  if (priority === 4) {
    // Sort heads alphabetically or keep them equal? 
    // User said "joined manually" for unique, followed by department heads.
    // Let's return 400 so they are at the end.
    return 400;
  }

  return 999;
}

function textToJsonArray(text) {
  if (!text || text.trim() === "") return [];
  return text.split('\n').map(line => line.trim()).filter(line => line !== "");
}

/**
 * นโยบายไม่ใช่ข้อความเปล่าเหมือนพันธกิจ — หน้าพรรคแสดงเป็นการ์ด "หัวข้อ + รายละเอียด"
 * ข้อมูลจริงจึงเป็น [{title, desc}] ไม่ใช่ [string]
 *
 * ก่อน 2026-07-28 ฝั่งแอดมินอ่านค่าออกมาด้วย .join('\n') ทำให้ช่องกรอกโชว์
 * "[object Object]" และถ้ากดบันทึกจะเขียนข้อความนั้นทับนโยบายจริงทั้งหมด (ข้อมูลหาย)
 * รูปแบบที่ตกลงกันคือหนึ่งบรรทัดต่อหนึ่งนโยบาย คั่นหัวข้อกับรายละเอียดด้วย "::"
 *   ยกระดับโครงการเดิม :: ปรับรูปแบบให้เข้ากับยุคสมัย
 * บรรทัดที่ไม่มี "::" ถือว่ามีแต่หัวข้อ — ไม่ทิ้งข้อมูลที่คนพิมพ์มา
 */
function textToPolicyArray(text) {
  if (!text || String(text).trim() === "") return [];
  return String(text)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .map((line) => {
      const i = line.indexOf('::');
      if (i === -1) return { title: line, desc: "" };
      return { title: line.slice(0, i).trim(), desc: line.slice(i + 2).trim() };
    });
}

async function uploadLogo(file, candidateName) {
  if (file && typeof file !== "string") {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = candidateName.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, "");
    const fileName = `${safeName}_${Date.now()}.jpg`;
    const uploadDir = path.join(process.cwd(), "public/images/candidates/logo");

    if (!fs.existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), await optimizeImage(buffer, { maxWidth: 700, format: "keep" }));

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
    const uploadDir = path.join(process.cwd(), "public/images/candidates/officialImageUrl");

    if (!fs.existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), await optimizeImage(buffer, { maxWidth: 1600, quality: 80 }));

    return `/images/candidates/officialImageUrl/${fileName}`;
  }
  return null;
}

// Helper: Upload Multiple Mobile Hero Images (Vertical Team)
async function uploadMultipleMobileHeroImages(files, candidateName, candidateId) {
  if (!files || files.length === 0) return [];

  const uploadedUrls = [];
  // ใช้ folder path ตามที่ user ต้องการ: /images/candidates/mobileheroimage/party{id}/
  const uploadDir = path.join(process.cwd(), `public/images/candidates/mobileheroimage/party${candidateId}`);
  if (!fs.existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file && typeof file !== "string") {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = candidateName.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, "");

      const fileName = `MOBILE_HERO_${safeName}_${Date.now()}_${i}.jpg`;

      await writeFile(path.join(uploadDir, fileName), await optimizeImage(buffer, { maxWidth: 1280, quality: 80 }));
      uploadedUrls.push(`/images/candidates/mobileheroimage/party${candidateId}/${fileName}`);
    }
  }
  return uploadedUrls;
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

      await writeFile(path.join(uploadDir, fileName), await optimizeImage(buffer, { maxWidth: 1600, quality: 80 }));
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

    await writeFile(path.join(uploadDir, fileName), await optimizeImage(buffer, { maxWidth: 800, quality: 82 }));
    return `/images/members/${folderName}/${fileName}`;
  }

  // No new file → keep whatever the DB currently holds. The DB wins over the
  // client's `existingImageUrl`: a form loaded before an earlier upload carries a
  // STALE path, and trusting it silently reverted members to a filename that no
  // longer exists on disk (broken images, 2026-07-19). The client value is only a
  // fallback for records the map does not know (e.g. a changed studentId).
  const dbUrl = existingImagesMap.get(memberData.studentId);
  if (dbUrl) return dbUrl;

  if (memberData.existingImageUrl && memberData.existingImageUrl !== "") {
    return memberData.existingImageUrl;
  }

  return "";
}

async function processMemberModalImage(memberData, formData, partyNumber, existingImagesMap = new Map()) {
  const file = formData.get(`member_modal_file_${memberData.studentId}`);
  const positionNum = getPositionNumber(memberData.position);
  const studentId = memberData.studentId || `id_${Date.now()}`;

  if (file && typeof file !== "string") {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${positionNum}_${studentId}.jpg`;
    const folderName = `party_${partyNumber}`;
    const uploadDir = path.join(process.cwd(), `public/images/members/${folderName}/Modal`);

    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    await writeFile(path.join(uploadDir, fileName), await optimizeImage(buffer, { maxWidth: 1000, quality: 82 }));
    return `/images/members/${folderName}/Modal/${fileName}`;
  }

  // Same rule as processMemberImage: the DB wins over a possibly-stale client value.
  const dbUrl = existingImagesMap.get(memberData.studentId);
  if (dbUrl) return dbUrl;

  if (memberData.existingModalImageUrl && memberData.existingModalImageUrl !== "") {
    return memberData.existingModalImageUrl;
  }

  return "";
}

// --- PUT (Update) ---
export async function PUT(req) {
  const authError = await adminGuard(req);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const formData = await req.formData();

    const dataToUpdate = {};

    if (formData.has("name")) dataToUpdate.name = formData.get("name");
    if (formData.has("number")) dataToUpdate.number = parseInt(formData.get("number"));
    // SLG-1: slogan is optional — normalize empty/whitespace-only → null so the
    // render-site `party?.slogan &&` guards collapse the slot (a stray " " is truthy
    // and would render an empty quoted slogan). Trim also drops incidental padding.
    if (formData.has("slogan")) dataToUpdate.slogan = (formData.get("slogan") || "").trim() || null;
    if (formData.has("color")) dataToUpdate.color = formData.get("color") || null;
    if (formData.has("logoMeaning")) dataToUpdate.logoMeaning = formData.get("logoMeaning");

    if (formData.has("missions")) {
      dataToUpdate.missions = textToJsonArray(formData.get("missions"));
    }
    if (formData.has("policies")) {
      dataToUpdate.policies = textToPolicyArray(formData.get("policies"));
    }

    const file = formData.get("file");
    if (file) {
      const currentName = dataToUpdate.name || "candidate_update";
      const newLogoUrl = await uploadLogo(file, currentName);
      if (newLogoUrl) dataToUpdate.logoUrl = newLogoUrl;
    }

    // --- Update Official Image (Mobile Hero Cover) ---
    const officialFile = formData.get("officialImage");
    if (officialFile) {
      const currentName = dataToUpdate.name || "candidate_update";
      const newOfficialUrl = await uploadOfficialImage(officialFile, currentName);
      if (newOfficialUrl) dataToUpdate.officialImageUrl = newOfficialUrl;
    }



    // --- Update Mobile Hero Images (Vertical Team - Multiple) ---
    // 1. Get existing images from DB to do cleanup later
    const existingCandidateData = await db.candidate.findUnique({
      where: { id: parseInt(id) },
      select: { mobileHeroImage: true }
    });

    let oldMobileHeroImages = [];
    if (existingCandidateData?.mobileHeroImage) {
      if (Array.isArray(existingCandidateData.mobileHeroImage)) oldMobileHeroImages = existingCandidateData.mobileHeroImage;
      else if (typeof existingCandidateData.mobileHeroImage === 'string') {
        try { oldMobileHeroImages = JSON.parse(existingCandidateData.mobileHeroImage) } catch (e) { oldMobileHeroImages = [existingCandidateData.mobileHeroImage] }
      }
    }
    if (!Array.isArray(oldMobileHeroImages)) oldMobileHeroImages = [];

    const existingMobileHeroImagesJson = formData.get("existingMobileHeroImages");
    let finalMobileHeroImages = [];

    if (existingMobileHeroImagesJson !== null) {
      try {
        finalMobileHeroImages = JSON.parse(existingMobileHeroImagesJson);
        if (!Array.isArray(finalMobileHeroImages)) finalMobileHeroImages = [];
      } catch (e) { finalMobileHeroImages = []; }
    } else {
      finalMobileHeroImages = [...oldMobileHeroImages];
    }

    const mobileHeroFiles = formData.getAll("mobileHeroFiles");
    const validMobileHeroFiles = mobileHeroFiles.filter(f => f && typeof f !== "string");

    if (validMobileHeroFiles.length > 0) {
      const currentName = dataToUpdate.name || "candidate_update";
      const newMobileHeroUrls = await uploadMultipleMobileHeroImages(validMobileHeroFiles, currentName, id);
      finalMobileHeroImages = [...finalMobileHeroImages, ...newMobileHeroUrls];
    }

    // Cleanup removed Mobile Hero images
    if (existingMobileHeroImagesJson !== null) {
      const mhImagesToDelete = oldMobileHeroImages.filter(url => !finalMobileHeroImages.includes(url));
      if (mhImagesToDelete.length > 0) {
        console.log(`🗑️ Deleting ${mhImagesToDelete.length} removed Mobile Hero images...`);
        await deleteMultipleImageFiles(mhImagesToDelete);
      }
    }

    if (validMobileHeroFiles.length > 0 || existingMobileHeroImagesJson !== null) {
      dataToUpdate.mobileHeroImage = finalMobileHeroImages;
    }

    const existingGroupImagesJson = formData.get("existingGroupImages");
    let finalGroupImages = [];

    // ดึงรูปเก่าจาก database ก่อน เพื่อเปรียบเทียบและลบไฟล์ที่ถูกลบออก
    const existingCandidate = await db.candidate.findUnique({
      where: { id: parseInt(id) },
      select: { groupImageUrls: true }
    });
    let oldGroupImages = existingCandidate?.groupImageUrls || [];
    if (!Array.isArray(oldGroupImages)) oldGroupImages = oldGroupImages ? [oldGroupImages] : [];

    if (existingGroupImagesJson !== null) {
      try {
        finalGroupImages = JSON.parse(existingGroupImagesJson);
        if (!Array.isArray(finalGroupImages)) finalGroupImages = [];
      } catch (e) {
        finalGroupImages = [];
      }
    } else {
      finalGroupImages = [...oldGroupImages];
    }

    const groupFiles = formData.getAll("groupFiles");
    const validGroupFiles = groupFiles.filter(f => f && typeof f !== "string");

    if (validGroupFiles.length > 0) {
      const currentName = dataToUpdate.name || "candidate_update";
      const newUrls = await uploadMultipleGroupImages(validGroupFiles, currentName, id);

      finalGroupImages = [...finalGroupImages, ...newUrls];
    }

    // หารูปที่ถูกลบออก (อยู่ใน old แต่ไม่อยู่ใน new) และลบไฟล์จริง
    if (existingGroupImagesJson !== null) {
      const imagesToDelete = oldGroupImages.filter(url => !finalGroupImages.includes(url));
      if (imagesToDelete.length > 0) {
        console.log(`🗑️ Deleting ${imagesToDelete.length} removed images...`);
        await deleteMultipleImageFiles(imagesToDelete);
      }
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
          select: { studentId: true, imageUrl: true, modalImageUrl: true }
        });
        const currentMemberImages = new Map(currentMembers.map(m => [m.studentId, m.imageUrl]));
        const currentMemberModalImages = new Map(currentMembers.map(m => [m.studentId, m.modalImageUrl]));

        const membersDataToCreate = await Promise.all(rawMembers.map(async (m) => {
          const imageUrl = await processMemberImage(m, formData, partyNumber, currentMemberImages);
          const modalImageUrl = await processMemberModalImage(m, formData, partyNumber, currentMemberModalImages);
          return {
            name: m.name,
            studentId: m.studentId,
            position: m.position,
            number: getPositionNumber(m.position), // ✅ Save position sequence
            major: m.major,
            imageUrl: imageUrl,
            modalImageUrl: modalImageUrl,
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
  const authError = await adminGuard(req);
  if (authError) return authError;
  try {
    const formData = await req.formData();
    const name = formData.get("name");
    const number = parseInt(formData.get("number"));
    // SLG-1: optional slogan — empty/whitespace-only → null (see PUT handler note).
    const slogan = (formData.get("slogan") || "").trim() || null;
    const color = formData.get("color") || null;
    const logoMeaning = formData.get("logoMeaning");
    const file = formData.get("file");
    const officialFile = formData.get("officialImage");
    const mobileHeroFile = formData.get("mobileHeroImage");
    const missions = textToJsonArray(formData.get("missions"));
    const policies = textToPolicyArray(formData.get("policies"));
    const membersJson = formData.get("members");
    const rawMembers = membersJson ? JSON.parse(membersJson) : [];

    const logoUrl = await uploadLogo(file, name);
    const officialImageUrl = await uploadOfficialImage(officialFile, name);

    // Process Mobile Hero Images later (after ID is generated)
    let mobileHeroImage = [];

    const membersDataToCreate = await Promise.all(rawMembers.map(async (m) => {
      const imageUrl = await processMemberImage(m, formData, number);
      // For new candidate creation, we might not have `member_modal_file_` inputs from Frontend yet if not updated,
      // but if user passes them, this will handle it.
      const modalImageUrl = await processMemberModalImage(m, formData, number);
      return {
        name: m.name,
        studentId: m.studentId,
        position: m.position,
        number: getPositionNumber(m.position), // ✅ Save position sequence
        major: m.major,
        imageUrl: imageUrl,
        modalImageUrl: modalImageUrl,
      };
    }));

    let newCandidate = await db.candidate.create({
      data: {
        name,
        number,
        slogan,
        color,
        logoUrl,
        officialImageUrl,
        mobileHeroImage,
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

    // Upload Mobile Hero Images (Files)
    const mobileHeroFiles = formData.getAll("mobileHeroFiles");
    const validMobileHeroFiles = mobileHeroFiles.filter(f => f && typeof f !== "string");

    let mobileHeroImageUrls = [];
    if (validMobileHeroFiles.length > 0) {
      mobileHeroImageUrls = await uploadMultipleMobileHeroImages(validMobileHeroFiles, name, newCandidate.id);
    }

    const groupFiles = formData.getAll("groupFiles");
    const validGroupFiles = groupFiles.filter(f => f && typeof f !== "string");

    let groupImageUrls = [];
    if (validGroupFiles.length > 0) {
      groupImageUrls = await uploadMultipleGroupImages(validGroupFiles, name, newCandidate.id);
    }

    // Update Candidate with images
    if (mobileHeroImageUrls.length > 0 || groupImageUrls.length > 0) {
      newCandidate = await db.candidate.update({
        where: { id: newCandidate.id },
        data: {
          groupImageUrls: groupImageUrls,
          mobileHeroImage: mobileHeroImageUrls
        },
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
  const authError = await adminGuard(req);
  if (authError) return authError;
  let target_id = null;
  try {
    const { searchParams } = new URL(req.url);
    target_id = parseInt(searchParams.get("id"));
    if (!target_id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // 1. ดึงข้อมูลรูปภาพเก็บไว้ก่อนลบจาก DB
    const candidateToDelete = await db.candidate.findUnique({
      where: { id: target_id },
      include: { members: true }
    });

    await db.$transaction(async (tx) => {
      // v2-SEC: ballots are anonymous + encrypted, so we can no longer identify
      // (and un-vote) the users who chose this party — that link is gone by
      // design. Deleting a party is therefore a PRE-ELECTION setup action; doing
      // it after votes exist leaves this party's ballots orphaned in the box
      // (they'd decrypt to a missing candidateId) and drops its score, which the
      // chain audit will flag as ballots>score drift. The admin owns that choice.
      await tx.member.deleteMany({
        where: { candidateId: target_id }
      });

      await tx.candidate.delete({
        where: { id: target_id }
      });
    });

    // 2. ลบไฟล์ออกจากเครื่อง (ทำหลังจากลบ DB สำเร็จแล้ว)
    if (candidateToDelete) {
      const imagesToDelete = [];

      // Logo & Official Image
      if (candidateToDelete.logoUrl) imagesToDelete.push(candidateToDelete.logoUrl);
      if (candidateToDelete.officialImageUrl) imagesToDelete.push(candidateToDelete.officialImageUrl);

      // Mobile Hero Image
      if (candidateToDelete.mobileHeroImage) {
        if (Array.isArray(candidateToDelete.mobileHeroImage)) {
          imagesToDelete.push(...candidateToDelete.mobileHeroImage);
        } else if (typeof candidateToDelete.mobileHeroImage === 'string') {
          // Handle case where it might be a JSON string or direct string
          try {
            const parsed = JSON.parse(candidateToDelete.mobileHeroImage);
            if (Array.isArray(parsed)) imagesToDelete.push(...parsed);
            else imagesToDelete.push(parsed);
          } catch (e) {
            imagesToDelete.push(candidateToDelete.mobileHeroImage);
          }
        }
      }

      // Group Images
      if (Array.isArray(candidateToDelete.groupImageUrls)) {
        imagesToDelete.push(...candidateToDelete.groupImageUrls);
      }

      // Members Images
      if (candidateToDelete.members) {
        candidateToDelete.members.forEach(m => {
          if (m.imageUrl) imagesToDelete.push(m.imageUrl);
        });
      }

      if (imagesToDelete.length > 0) {
        console.log(`🗑️ Cleaning up files for candidate ${target_id}...`);
        // ใช้ setTimeout เพื่อไม่ให้ block response นานเกินไป (Fire and forget)
        deleteMultipleImageFiles(imagesToDelete);
      }
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete", details: error.message, candidate_id: target_id }, { status: 500 });
  }
}