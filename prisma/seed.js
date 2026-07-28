const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // Import bcryptjs
const { loadEnv } = require('../scripts/lib/loadEnv');
const { encryptBallot } = require('../src/lib/ballotCrypto');
const { appendBallotTx, hourBucketBangkok } = require('../src/lib/ballotChain');

loadEnv();
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // v2-SEC: seeded ballots must be chained EXACTLY like real ones (same helper),
  // so the ballot-crypto env must be present or reconcile/verify would diverge.
  const publicKeyPem = process.env.ELECTION_BALLOT_PUBLIC_KEY;
  const chainSecret = process.env.BALLOT_CHAIN_SECRET;
  if (!publicKeyPem || !chainSecret) {
    throw new Error(
      'Seeding needs ELECTION_BALLOT_PUBLIC_KEY + BALLOT_CHAIN_SECRET (run scripts/generate-election-keys.js and set them in .env).'
    );
  }

  // 1. ล้างข้อมูลเก่า
  try {
    // เพิ่ม SystemConfig ลงใน Truncate list
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "SystemConfig" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Member" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Candidate" RESTART IDENTITY CASCADE;`);
    // v2-SEC: empty the ballot box + reset the chain to genesis so the seeded
    // ballots form a fresh, self-consistent chain (score == ballots == voted).
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Ballot" RESTART IDENTITY CASCADE;`);
    console.log('🧹 Database cleaned');
  } catch (error) {
    console.log('⚠️ Truncate failed, using deleteMany...');
    await prisma.systemConfig.deleteMany(); // Clear Config
    await prisma.member.deleteMany();
    await prisma.user.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.ballot.deleteMany();
  }
  // Reset the chain tip to genesis (idempotent — table may be empty in dev).
  await prisma.chainHead.upsert({
    where: { id: 1 },
    update: { head: 'GENESIS', seq: 0 },
    create: { id: 1, head: 'GENESIS', seq: 0 },
  });

  // 2. สร้าง SystemConfig (สำคัญมาก! ระบบต้องมี ID=1 เสมอ)
  await prisma.systemConfig.create({
    data: {
      id: 1,
      isVoteOpen: true,
      showResult: false, // ปิดผลโหวตไว้ก่อน
      systemMode: "AUTO", // ใช้โหมด AUTO ตามเวลา
      googleFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSf7K7cYHd2819ODsQmWzWk1NDIhELS56vuZwBj2RONCZGK25w/viewform?fbzx=-1022028266153116941&pli=1",
      pageLayout: {
        home: [
          { type: "hero",           visible: true, order: 1, config: { showCountdown: true, showStatusBadge: true } },
          { type: "meetCandidates", visible: true, order: 2, config: {} },
          { type: "stats",          visible: true, order: 3, config: { showPercentage: true, showTotalEligible: true } },
          { type: "electionBanner", visible: true, order: 4, config: {} },
          { type: "voteCTA",        visible: true, order: 5, config: {} }
        ],
        vote: {
          multiParty: {
            gridCols: "auto",
            cardVariant: "grid",
            showDivider: true,
            abstainStyle: "standard"
          }
        },
        theme: {
          primaryColor: "#8A2680",
          accentColor: "#9333EA",
          borderRadius: "rounded"
        }
      }
    }
  });
  console.log('✅ SystemConfig created.');

  // 3. ข้อมูลสมาชิกพรรค SAMO Together (21 คน จากไฟล์ที่อัปโหลด)
  const samoMembers = [
    { no: 1, studentId: '6710517152', name: 'สมิตานันท์ ธรณสุนทร', position: 'นายกสโมสรนักศึกษา', major: 'บัญชี' },
    { no: 2, studentId: '6710515096', name: 'สุภัคกานต์ สุทธิพันธ์', position: 'อุปนายกฝ่ายกิจการภายใน', major: 'รัฐประศาสนศาสตร์' },
    { no: 3, studentId: '6710515043', name: 'นันทณัฐ หัสชัย', position: 'อุปนายกฝ่ายกิจการภายนอก', major: 'รัฐประศาสนศาสตร์' },
    { no: 4, studentId: '6810510535', name: 'พิรญาณ์ โกกิละวาที', position: 'เลขานุการ', major: 'การตลาด' },
    { no: 5, studentId: '6710517051', name: 'ธนกร แก้วมณี', position: 'เหรัญญิก', major: 'บัญชี' },
    { no: 6, studentId: '6810510487', name: 'อิดริส หมัดตะพงศ์', position: 'ประธานฝ่ายประชาสัมพันธ์', major: 'ระบบสารสนเทศทางธุรกิจ' },
    { no: 7, studentId: '6810515075', name: 'บุญสิตา วัยภักดิ์', position: 'ประธานฝ่ายสวัสดิการ', major: 'รัฐประศาสนศาสตร์' },
    { no: 8, studentId: '6810517021', name: 'ชยุตพงศ์ วิธธีระ', position: 'ประธานฝ่ายพัสดุ', major: 'บัญชี' },
    { no: 9, studentId: '6810515043', name: 'วัชรโรจน์ ไกรสุวรรณสาร', position: 'ประธานฝ่ายกีฬา', major: 'รัฐประศาสนศาสตร์' },
    { no: 10, studentId: '6810510416', name: 'ภัทรวดี นิ่มแก้ว', position: 'ประธานฝ่ายวิชาการ', major: 'การจัดการโลจิสติกส์และโซ่อุปทาน' },
    { no: 11, studentId: '6810510485', name: 'อาทิตยา ดีแก้ว', position: 'ประธานฝ่ายศิลปวัฒนธรรม', major: 'การเงินและการลงทุน' },
    { no: 12, studentId: '6810517075', name: 'เมธาวดี มากทอง', position: 'ประธานฝ่ายข้อมูลกิจกรรมนักศึกษา', major: 'บัญชี' },
    { no: 13, studentId: '6810515088', name: 'วิษณุ บุญเดช', position: 'ประธานฝ่ายเทคโนโลยีสารสนเทศ', major: 'รัฐประศาสนศาสตร์' },
    { no: 14, studentId: '6710517210', name: 'ณัฐชนน คงแก้ว', position: 'ประธานฝ่ายประเมินผล', major: 'บัญชี' },
    { no: 15, studentId: '6710517046', name: 'ธาวัลย์ มณีสกด', position: 'ประธานฝ่ายสันทนาการ', major: 'บัญชี' },
    { no: 16, studentId: '6810510353', name: 'ณาสิตา บุญโรจน์พงศ์', position: 'ประธานฝ่ายสาธารณสุข', major: 'การเงินและการลงทุน' },
    { no: 17, studentId: '6710510171', name: 'นพวิชญ์ นพคุณ', position: 'ประธานฝ่ายสถานที่', major: 'การจัดการโลจิสติกส์และโซ่อุปทาน' },
    { no: 18, studentId: '6810510063', name: 'ชุติมน เรืองชัย', position: 'ประธานฝ่ายกิจกรรม', major: 'การเงินและการลงทุน' },
    { no: 19, studentId: '6810515130', name: 'อนุชา ชูชุม', position: 'ประธานฝ่ายครีเอทีฟ', major: 'รัฐประศาสนศาสตร์' },
    { no: 20, studentId: '6810510023', name: 'กุลจิรา ไกรวงค์', position: 'ประธานฝ่ายพิธีการ', major: 'การตลาด' },
    { no: 21, studentId: '6810517132', name: 'จุพลณัฐ วิรุฬห์กรสกุล', position: 'ประธานฝ่ายจัดซื้อจัดจ้าง', major: 'บัญชี' }
  ];

  // 4. เตรียมข้อมูลพรรค
  const partiesData = [
    {
      name: 'The Unity Concord Of FMS 2',
      number: 1,
      // 1. Logo (Use actual filename found)
      logoUrl: '/images/candidates/logo/The_Unity_Concord_Of_FMS_2_1769189878513.jpg',
      // 2. Group Image (Use Official Image as fallback since groupimage folder is empty/mismatched)
      groupImages: ['/images/candidates/officialimageUrl/party1/groupeditimage.PNG'],
      // 3. Mobile Hero Vertical (Use 1.png found)
      mobileHeroImages: ['/images/candidates/mobileheroimage/party1/1.png'],
      // 4. Official Hero Section (Use groupeditimage.PNG found)
      officialImageUrl: '/images/candidates/officialimageUrl/party1/groupeditimage.PNG',

      members: samoMembers,
      slogan: 'หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน',
      logoMeaning: `The Unity Concord of FMS สะท้อนถึงความสำคัญของการรวมตัวกันเป็นหนึ่งเดียวกันในหมู่คณะ เพื่อสร้างความร่วมมือที่มีประสิทธิภาพในการดำเนินกิจกรรมหรือโครงการต่าง ๆ เพื่อประโยชน์ส่วนรวม 
Unity คือ ความสามัคคี ซึ่งหมายถึงความสัมพันธ์ที่ทุกคนในหมู่คณะมีเป้าหมายร่วมกันเพื่อประโยชน์ส่วนรวม และเป็นการรวมตัวของบุคคลที่มีความหลากหลาย แต่สามารถทำงานร่วมกันเพื่อบรรลุเป้าหมายที่วางไว้ ซึ่งความสามัคคีเป็นรากฐานสำคัญของการสร้างความสำเร็จในงานต่าง ๆ 
Concord คือ ความปรองดอง ซึ่งเน้นไปที่การสร้างความสัมพันธ์ที่สงบสุขในหมู่คณะที่ทุกคนสามารถทำงานร่วมกันด้วยความเคารพ ให้เกียรติ และประนีประนอมซึ่งกันและกัน
ตัวเรือนั้น เกิดจากการผสมผสานระหว่างตัวอักษร F M และ S โดย
F - ส่วนใบเรือจรดท้องเรือ ซึ่งใบเรือมีหน้าที่โอบอุ้มลมเพื่อขับเคลื่อนและนำพาเรือไปข้างหน้า เปรียบเสมือนพลังที่จะนำพาคณะวิทยาการจัดการไปข้างหน้าจนกระทั่งถึงจุดหมาย 
M - โครงสร้างกลางเรือ ซึ่งเป็นหัวใจสำคัญที่จะช่วยค้ำจุนเรือไว้ เปรียบเสมือนความตั้งใจและมุ่งมั่นที่จะช่วยให้สมาชิกทุกคนยืนหยัดและก้าวไปพร้อมกันด้วยความสามัคคี
S - หัวสิงห์ สิงห์มักจะถูกใช้เป็นสัญลักษณ์ของความเป็นผู้นำ ความกล้าหาญ และความแข็งแกร่ง โดยหัวสิงห์นั้นได้ชี้ไปยังทิศทางที่เรือกำลังมุ่งไปข้างหน้า แสดงถึงวิสัยทัศน์และความเด็ดเดี่ยวที่พร้อมฝ่าฟันอุปสรรค
เลข 2 คือ การสานต่ออุดมการณ์ของการทำกิจกรรมเพื่อนักศึกษาคณะวิทยาการจัดการ ผ่านการนำประสบการณ์การดำเนินงานที่ผ่านมาเป็นรากฐานในการพัฒนา ปรับปรุง และต่อยอดเพื่อเพิ่มคุณค่าและประสิทธิภาพของกิจกรรม
ดวงดาวทั้ง 9 ดวง เปรียบเสมือน 9 สาขาวิชาของคณะวิทยาการจัดการ ทำหน้าที่เป็นแสงนำทางให้แก่สิงห์สำเภา ขณะที่เรือสีม่วงสะท้อนถึงจิตวิญญาณของคณะวิทยาการจัดการที่มีความมั่นคง แข็งแกร่ง และพร้อมเผชิญทุกสถานการณ์`,
      missions: [
        'บูรณาการเสริมสร้างองค์ความรู้และพัฒนาเพื่อยกระดับทักษะด้านวิชาชีพรวมถึงกิจกรรมต่าง ๆ',
        'มุ่งเน้นการสร้างสังคมที่มีความเป็นหนึ่งเดียวจากความหลากหลายและการเคารพสิทธิเพื่อการอยู่ร่วมกันอย่างสันติ',
        'เปิดโอกาสในการแสดงศักยภาพและความสามารถในทุกด้านเพื่อพัฒนาทรัพยากรบุคคลให้เกิดประโยชน์สูงสุด'
      ],
      policies: [
        { title: 'ยกระดับและพัฒนาโครงการ', desc: 'ยกระดับโครงการเดิมและพัฒนาโครงการใหม่เพื่อปรับเปลี่ยนรูปแบบและแนวคิดให้มีความเหมาะสมกับยุคสมัยมากขึ้น' },
        { title: 'ส่งเสริมความคิดสร้างสรรค์', desc: 'ส่งเสริมกิจกรรมด้านความคิดสร้างสรรค์ และเปิดโอกาสให้นักศึกษาได้แสดงออกอย่างเหมาะสม ควบคู่กับการเสริมสร้างสุขภาพจิตที่ดีของนักศึกษาคณะวิทยาการจัดการ' },
        { title: 'พื้นที่แสดงความคิดเห็น', desc: 'สร้างพื้นที่ในการแสดงออกความคิดเห็นและข้อเสนอแนะเพื่อนำมาพัฒนาและปรับปรุงการจัดกิจกรรมต่าง ๆ ให้เกิดประโยชน์สูงสุดแก่นักศึกษาคณะวิทยาการจัดการ' },
        { title: 'สร้างเครือข่ายความร่วมมือ', desc: 'สร้างเครือข่ายชุมชนและองค์กรที่มุ่งเน้นความหลากหลายและการอยู่ร่วมกันอย่างสันติ ผ่านการจัดกิจกรรมเสริมสร้างความเข้าใจในวัฒนธรรมที่หลากหลาย' }
      ]
    },
    {
      name: 'งดออกเสียง',
      number: 0,
      logoUrl: null,
      members: []
    },
    {
      name: 'ไม่รับรอง',
      number: -1,
      logoUrl: null,
      members: []
    },
  ];

  const createdCandidates = [];

  // Map for irregularities in member filenames (based on file system check)
  const memberImageMap = {
    15: '15 สันทนาการ.png',
    16: '16 สาธารณสุข.png',
    17: '17 สถานที่.png',
    18: '18 กิจกรรม.png',
    19: '19.ครีเอทีฟ.png',
    20: '20 พิธีการ.png',
    21: '21.จัดซื้อจัดจ้าง.png'
  };

  // 5. สร้างพรรคและสมาชิก
  for (const p of partiesData) {
    // สร้าง Candidate (พรรค)
    const candidate = await prisma.candidate.create({
      data: {
        name: p.name,
        number: p.number,
        score: 0,

        // --- Image Fields Mapping ---
        logoUrl: p.logoUrl,
        groupImageUrls: p.groupImages,       // Map to Json
        mobileHeroImage: p.mobileHeroImages, // Map to Json
        officialImageUrl: p.officialImageUrl,// Map to String

        slogan: p.slogan,
        logoMeaning: p.logoMeaning,
        missions: p.missions ? p.missions : undefined,
        policies: p.policies ? p.policies : undefined,
      }
    });
    createdCandidates.push(candidate);
    console.log(`✅ Created Party: [${p.number}] ${candidate.name}`);

    // สร้างสมาชิก (Members)
    if (p.members.length > 0) {
      for (const m of p.members) {
        // ใช้ Mapping ถ้ามี ไม่งั้นใช้ .jpg ตามปกติ
        const filename = memberImageMap[m.no] || `${m.no}.jpg`;
        const imagePath = `/images/members/party_${p.number}/${filename}`;

        // Modal - Default to .jpg unless missing (Note: 8-21 missing in Modal folder based on check, but leaving logic consistent)
        const modalImagePath = `/images/members/party_${p.number}/Modal/${m.no}.jpg`;

        await prisma.member.create({
          data: {
            studentId: m.studentId,
            name: m.name,
            number: m.no, // Saved for sorting
            imageUrl: imagePath,
            modalImageUrl: modalImagePath,
            position: m.position,
            major: m.major,
            candidateId: candidate.id
          }
        });
      }
      console.log(`   - Added ${p.members.length} members`);
    }
  }

  // 6. เสก User 500 คน (Voters)
  const votersCount = 500;
  console.log(`Populating ${votersCount} voters...`);

  // Mapping สาขาจริง (Mock Data ให้สมจริงตาม Database)
  const majorData = [
    { code: 'PA', name: 'รัฐประศาสนศาสตร์', id: 'M001' },
    { code: 'BBA', name: 'การจัดการ', id: 'M002' },
    { code: 'ACC', name: 'การบัญชี', id: 'M003' },
    { code: 'HRM', name: 'การจัดการทรัพยากรมนุษย์', id: 'M004' },
    { code: 'LSM', name: 'การจัดการโลจิสติกส์', id: 'M005' },
    { code: 'FIN', name: 'การเงินและการลงทุน', id: 'M006' },
    { code: 'MKT', name: 'การตลาด', id: 'M007' },
    { code: 'BIS', name: 'ระบบสารสนเทศทางธุรกิจ', id: 'M008' },
    { code: 'MICE', name: 'การจัดการไมซ์', id: 'M009' }
  ];

  const years = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];
  const genders = ['M', 'F'];
  const yearPrefixMap = { 'ปี 1': '68', 'ปี 2': '67', 'ปี 3': '66', 'ปี 4': '65' };

  // รายชื่อ Admin ที่เราจองไว้ (ห้ามให้ระบบสุ่ม Voter ไปทับ)
  const reservedAdminIds = ['6610510149', '6610510129'];

  for (let i = 0; i < votersCount; i++) {
    const selectedMajor = majorData[Math.floor(Math.random() * majorData.length)];
    const randomYear = years[Math.floor(Math.random() * years.length)];
    const randomGender = genders[Math.floor(Math.random() * genders.length)];
    const runningNumber = String(100 + i).padStart(3, '0');
    const realStudentId = `${yearPrefixMap[randomYear] || '64'}10510${runningNumber}`;

    // เช็คว่า ID ที่สุ่มได้ ไปชนกับ Admin หรือไม่
    if (reservedAdminIds.includes(realStudentId)) {
      continue;
    }

    const isVoted = Math.random() < 0.8;
    let votedCandidateId = null;
    if (isVoted) {
      // สุ่มโหวตให้ Candidate ที่สร้างไว้จริง (รวมทั้ง No Vote/Vote No)
      const randomCandidate = createdCandidates[Math.floor(Math.random() * createdCandidates.length)];
      votedCandidateId = randomCandidate.id;
    }

    // กำหนดคำนำหน้าชื่อ
    const titleName = randomGender === 'M' ? 'นาย' : 'นางสาว';

    // Mapping YearStatus
    const yearStatusMap = { 'ปี 1': '1', 'ปี 2': '2', 'ปี 3': '3', 'ปี 4': '4' };
    const yearStatus = yearStatusMap[randomYear] || '1';

    const votedAt = isVoted ? new Date() : null;

    await prisma.user.create({
      data: {
        studentId: realStudentId,
        titleName: titleName,
        name: `นักศึกษาทดสอบ ${i + 1}`,
        email: `${realStudentId}@email.psu.ac.th`,
        gender: randomGender,
        year: randomYear,
        yearStatus: yearStatus, // เก็บค่าดิบ (1-4)

        // --- Mapping Fields ---
        major: selectedMajor.code,           // ใช้ Code เป็นหลักสำหรับ Logic กราฟ
        subKeyId: selectedMajor.code,        // Field นี้ใน Excel คือตัวย่อสาขา เหมือนกัน
        subMajorId: selectedMajor.id,        // รหัสสาขา (สมมติ)
        subMajorNameThai: selectedMajor.name,// ชื่อภาษาไทย

        isVoted: isVoted,
        votedAt: votedAt,
        isAdmin: false
      }
    });

    // v2-SEC: append the anonymous, encrypted, chained ballot through the SAME
    // helper the vote route uses, and tally the score — in one transaction, so
    // #ballots == sum(score) == #voted stays exact for reconcile/verify.
    if (isVoted) {
      const payload = encryptBallot(votedCandidateId, publicKeyPem);
      const hourBucket = hourBucketBangkok(votedAt.getTime());
      await prisma.$transaction(async (tx) => {
        await appendBallotTx(tx, { payload, hourBucket, chainSecret });
        await tx.candidate.update({
          where: { id: votedCandidateId },
          data: { score: { increment: 1 } },
        });
      });
    }
  }
  console.log(`✅ 500 Voters created.`);

  // 7. สร้าง Admin Users
  console.log('✨ Creating Admins...');

  // รหัสผ่านแอดมินเป็น "รหัสกลาง" ตัวเดียวใน SystemConfig — ตัวตนมาจาก
  // รหัส นศ. ที่พิมพ์ตอนล็อกอิน + isAdmin ของแถวนั้น (ดู scripts/admin.js)
  // สุ่มใหม่ทุกครั้งที่ seed แล้วพิมพ์ออกมาครั้งเดียว: ก่อนหน้านี้ไฟล์นี้ฝังรหัส dev
  // ไว้เป็น literal ซึ่งแปลว่ามันอยู่ใน git ของ repo สาธารณะตลอดมา
  const { generatePassword } = require('../scripts/lib/password');
  const seedAdminPassword = generatePassword();
  await prisma.systemConfig.update({
    where: { id: 1 },
    data: { adminPasswordHash: await bcrypt.hash(seedAdminPassword, 12) },
  });

  // ลบออกก่อนถ้ามี (เพื่อความชัวร์)
  await prisma.user.deleteMany({
    where: { studentId: { in: reservedAdminIds } }
  });

  await prisma.user.createMany({
    data: [
      {
        studentId: '6610510149',
        name: 'Teerapab Boonsri',
        email: '6610510149@email.psu.ac.th',
        gender: 'M', major: 'BIS', year: 'ปี 3',
        yearStatus: '3',
        isVoted: false,
        role: 'ADMIN',
        isAdmin: true,
      },
      {
        studentId: '6610510129',
        name: 'Thanutchaporn Awapark',
        email: '6610510129@email.psu.ac.th',
        gender: 'F', major: 'BIS', year: 'ปี 3',
        yearStatus: '3',
        isVoted: false,
        role: 'ADMIN',
        isAdmin: true,
      }
    ]
  });

  console.log(`✅ Seeded complete!`);
  console.log(`\n   แอดมิน 2 คน: ${reservedAdminIds.join(', ')}`);
  console.log(`   รหัสกลาง (แสดงครั้งเดียว): ${seedAdminPassword}`);
  console.log(`   เปลี่ยนใหม่: node scripts/admin.js --rotate-password\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });