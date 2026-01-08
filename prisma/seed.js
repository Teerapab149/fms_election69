const { PrismaClient } = require('@prisma/client');
const { Group } = require('lucide-react');
const prisma = new PrismaClient()

// 1. เตรียมรายชื่อตำแหน่ง 20 ลำดับ
const positions = [
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

// --- Helper Function: สร้างรายชื่อสมาชิก 20 คน ---
const generatePartyMembers = (partyNumber, startStudentIdPrefix) => {
  const members = [];

  for (let i = 0; i < 20; i++) {
    const runningNum = String(i + 1).padStart(3, '0');
    const studentId = `${startStudentIdPrefix}${runningNum}`;

    const name = `ผู้สมัครลำดับที่ ${i + 1} พรรคเบอร์ ${partyNumber}`;
    const imagePath = `/images/members/party_${partyNumber}/${i + 1}.jpg`;

    members.push({
      studentId: studentId,
      name: name,
      position: positions[i] || "สมาชิกพรรค",
      email: `${studentId}@email.psu.ac.th`,
      imageUrl: imagePath
    });
  }
  return members;
};

async function main() {
  console.log('🌱 Start seeding (Full 20 Members)...')

  // 1. ล้างข้อมูลเก่า
  try {
    // คำสั่งสำหรับ PostgreSQL
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Member" RESTART IDENTITY CASCADE;`)
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`)
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Candidate" RESTART IDENTITY CASCADE;`)
    console.log('🧹 Database cleaned (TRUNCATE)')
  } catch (error) {
    console.log('⚠️ Truncate failed, using deleteMany...')
    await prisma.member.deleteMany()
    await prisma.user.deleteMany()
    await prisma.candidate.deleteMany()
  }

  // 2. ข้อมูลพรรค
  const partiesData = [
    {
      name: 'พรรค SAMO Together',
      number: 1,
      logoUrl: '/images/candidates/logo/1.jpg',
      groupImageUrl: '/images/candidates/groupimage/party1',
      members: generatePartyMembers(1, '6610510')
    },
    {
      name: 'พรรค Change FMS',
      number: 2,
      logoUrl: '/images/candidates/logo/2.jpg',
      groupImageUrl: '/images/candidates/groupimage/party2',
      members: generatePartyMembers(2, '6710510')
    },
    {
      name: 'พรรค New Gen',
      number: 3,
      logoUrl: '/images/candidates/logo/3.jpg',
      groupImageUrl: '/images/candidates/groupimage/party3',
      members: generatePartyMembers(3, '6810510')
    },
    {
      name: 'พรรค Future Forward',
      number: 4,
      logoUrl: '/images/candidates/logo/4.jpg',
      groupImageUrl: '/images/candidates/groupimage/party4',
      members: generatePartyMembers(4, '6510510')
    },
    {
      name: 'งดออกเสียง',
      number: 0,
      logoUrl: null,
      members: []
    }
  ];

  const createdCandidates = []

  // 3. วนลูปสร้างพรรคและสมาชิก
  for (const p of partiesData) {
    // สร้างพรรค
    const candidate = await prisma.candidate.create({
      data: {
        name: p.name,
        number: p.number,
        score: 0,
        logoUrl: p.logoUrl
      }
    })
    createdCandidates.push(candidate)
    console.log(`✅ Created: [${p.number}] ${candidate.name} (${p.members.length} members)`)

    // สร้างสมาชิกในพรรค
    if (p.members.length > 0) {
      for (const m of p.members) {
        await prisma.member.create({
          data: {
            studentId: m.studentId,
            name: m.name,
            email: m.email,
            imageUrl: m.imageUrl,
            position: m.position,
            candidateId: candidate.id
          }
        })
      }
    }
  }

  // 4. เสก User 500 คน (Voters)
  const votersCount = 500;
  console.log(`Populating ${votersCount} voters...`)

  const majors = ['PA', 'BBA', 'ACC', 'HRM', 'LSM', 'FIN', 'MKT', 'BIS', 'MICE']
  const years = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4', 'อื่นๆ']
  const genders = ['ชาย', 'หญิง']
  const yearPrefixMap = { 'ปี 1': '68', 'ปี 2': '67', 'ปี 3': '66', 'ปี 4': '65', 'อื่นๆ': '64' }

  // รายชื่อ Admin ที่เราจองไว้ (ห้ามให้ระบบสุ่ม Voter ไปทับ)
  const reservedAdminIds = ['6610510149', '6610510129'];

  for (let i = 0; i < votersCount; i++) {
    const randomMajor = majors[Math.floor(Math.random() * majors.length)]
    const randomYear = years[Math.floor(Math.random() * years.length)]
    const randomGender = genders[Math.floor(Math.random() * genders.length)]
    const runningNumber = String(100 + i).padStart(3, '0');
    const realStudentId = `${yearPrefixMap[randomYear] || '64'}10510${runningNumber}`;

    // ✅ แก้ไข 1: เช็คว่า ID ที่สุ่มได้ ไปชนกับ Admin หรือไม่?
    if (reservedAdminIds.includes(realStudentId)) {
      console.log(`Skipping reserved ID: ${realStudentId}`);
      continue; // ถ้าชน ให้ข้ามรอบนี้ไปเลย (ไม่สร้าง User นี้)
    }

    const isVoted = Math.random() < 0.8
    let votedCandidateId = null

    if (isVoted) {
      const randomCandidate = createdCandidates[Math.floor(Math.random() * createdCandidates.length)]
      votedCandidateId = randomCandidate.id
      await prisma.candidate.update({
        where: { id: votedCandidateId },
        data: { score: { increment: 1 } }
      })
    }

    await prisma.user.create({
      data: {
        studentId: realStudentId,
        name: `นักศึกษาทดสอบ ${i + 1}`,
        email: `${realStudentId}@email.psu.ac.th`,
        gender: randomGender,
        major: randomMajor,
        year: randomYear,
        isVoted: isVoted,
        candidateId: votedCandidateId
      }
    })
  }

  // 5. User พิเศษ (Admin)
  // ✅ แก้ไข 2: ใช้ Logic ลบก่อนสร้าง (กันเหนียว เผื่อมีหลุดมา)
  console.log('✨ Creating Admins...');

  // ลบออกก่อนถ้ามี (เพื่อความชัวร์ 100%)
  await prisma.user.deleteMany({
    where: { studentId: { in: reservedAdminIds } }
  });

  // สร้างใหม่
  await prisma.user.createMany({
    data: [
      {
        studentId: '6610510149',
        name: 'Teerapab Boonsri',
        email: '6610510149@email.psu.ac.th',
        gender: 'ชาย', major: 'BIS', year: 'ปี 3',
        isVoted: false, candidateId: null,
        role: 'ADMIN',
        password: '1150',
      },
      {
        studentId: '6610510129',
        name: 'Thanutchaporn Awapark',
        email: '6610510129@email.psu.ac.th',
        gender: 'หญิง', major: 'BIS', year: 'ปี 3',
        isVoted: false, candidateId: null,
        role: 'ADMIN',
        password: '1234'
      },
      {
        studentId: '9999',
        name: 'เทพผู้อยู่เบื้องหลัง',
        email: 'god@megumail',
        gender: 'หญิง', major: 'BIS', year: 'ปี 3',
        isVoted: false, candidateId: null,
        role: 'ADMIN',
        password: '9999'
      }
    ]
  });

  console.log(`✅ Seeded complete!`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })