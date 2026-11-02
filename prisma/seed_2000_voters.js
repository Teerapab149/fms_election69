const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcryptjs'); // Removed for Docker compatibility
require('../scripts/lib/loadEnv').loadEnv();
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Start seeding (2,000 Unvoted Users Template)...');

    // 1. ล้างข้อมูลเก่า
    try {
        // เพิ่ม SystemConfig ลงใน Truncate list
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "SystemConfig" RESTART IDENTITY CASCADE;`);
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Member" RESTART IDENTITY CASCADE;`);
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`);
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Candidate" RESTART IDENTITY CASCADE;`);
        // v2-SEC: empty the ballot box too (all users here are unvoted → empty).
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
    // v2-SEC: reset the chain tip to genesis (this template seeds ZERO ballots).
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
            googleFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSf7K7cYHd2819ODsQmWzWk1NDIhELS56vuZwBj2RONCZGK25w/viewform?fbzx=-1022028266153116941&pli=1" // ตัวอย่าง URL
        }
    });
    console.log('✅ SystemConfig created.');

    // 3. ข้อมูลสมาชิกพรรค SAMO (21 คน จากไฟล์ที่อัปโหลด)
    const samoMembers = [
        { no: 1, studentId: '9950000001', name: 'สมาชิกตัวอย่าง 1', position: 'นายกสโมสรนักศึกษา', major: 'บัญชี' },
        { no: 2, studentId: '9950000002', name: 'สมาชิกตัวอย่าง 2', position: 'อุปนายกฝ่ายกิจการภายใน', major: 'รัฐประศาสนศาสตร์' },
        { no: 3, studentId: '9950000003', name: 'สมาชิกตัวอย่าง 3', position: 'อุปนายกฝ่ายกิจการภายนอก', major: 'รัฐประศาสนศาสตร์' },
        { no: 4, studentId: '9950000004', name: 'สมาชิกตัวอย่าง 4', position: 'เลขานุการ', major: 'การตลาด' },
        { no: 5, studentId: '9950000005', name: 'สมาชิกตัวอย่าง 5', position: 'เหรัญญิก', major: 'บัญชี' },
        { no: 6, studentId: '9950000006', name: 'สมาชิกตัวอย่าง 6', position: 'ประธานฝ่ายประชาสัมพันธ์', major: 'ระบบสารสนเทศทางธุรกิจ' },
        { no: 7, studentId: '9950000007', name: 'สมาชิกตัวอย่าง 7', position: 'ประธานฝ่ายสวัสดิการ', major: 'รัฐประศาสนศาสตร์' },
        { no: 8, studentId: '9950000008', name: 'สมาชิกตัวอย่าง 8', position: 'ประธานฝ่ายพัสดุ', major: 'บัญชี' },
        { no: 9, studentId: '9950000009', name: 'สมาชิกตัวอย่าง 9', position: 'ประธานฝ่ายกีฬา', major: 'รัฐประศาสนศาสตร์' },
        { no: 10, studentId: '9950000010', name: 'สมาชิกตัวอย่าง 10', position: 'ประธานฝ่ายวิชาการ', major: 'การจัดการโลจิสติกส์และโซ่อุปทาน' },
        { no: 11, studentId: '9950000011', name: 'สมาชิกตัวอย่าง 11', position: 'ประธานฝ่ายศิลปวัฒนธรรม', major: 'การเงินและการลงทุน' },
        { no: 12, studentId: '9950000012', name: 'สมาชิกตัวอย่าง 12', position: 'ประธานฝ่ายข้อมูลกิจกรรมนักศึกษา', major: 'บัญชี' },
        { no: 13, studentId: '9950000013', name: 'สมาชิกตัวอย่าง 13', position: 'ประธานฝ่ายเทคโนโลยีสารสนเทศ', major: 'รัฐประศาสนศาสตร์' },
        { no: 14, studentId: '9950000014', name: 'สมาชิกตัวอย่าง 14', position: 'ประธานฝ่ายประเมินผล', major: 'บัญชี' },
        { no: 15, studentId: '9950000015', name: 'สมาชิกตัวอย่าง 15', position: 'ประธานฝ่ายสันทนาการ', major: 'บัญชี' },
        { no: 16, studentId: '9950000016', name: 'สมาชิกตัวอย่าง 16', position: 'ประธานฝ่ายสาธารณสุข', major: 'การเงินและการลงทุน' },
        { no: 17, studentId: '9950000017', name: 'สมาชิกตัวอย่าง 17', position: 'ประธานฝ่ายสถานที่', major: 'การจัดการโลจิสติกส์และโซ่อุปทาน' },
        { no: 18, studentId: '9950000018', name: 'สมาชิกตัวอย่าง 18', position: 'ประธานฝ่ายกิจกรรม', major: 'การเงินและการลงทุน' },
        { no: 19, studentId: '9950000019', name: 'สมาชิกตัวอย่าง 19', position: 'ประธานฝ่ายครีเอทีฟ', major: 'รัฐประศาสนศาสตร์' },
        { no: 20, studentId: '9950000020', name: 'สมาชิกตัวอย่าง 20', position: 'ประธานฝ่ายพิธีการ', major: 'การตลาด' },
        { no: 21, studentId: '9950000021', name: 'สมาชิกตัวอย่าง 21', position: 'ประธานฝ่ายจัดซื้อจัดจ้าง', major: 'บัญชี' }
    ];

    // 4. เตรียมข้อมูลพรรค
    const partiesData = [
        {
            name: 'พรรคตัวอย่าง',
            number: 1,
            // ข้อมูลสมมติทั้งหมด ไม่มีบุคคลจริง รูปทุกช่องใช้ภาพตัวแทนกลาง
            logoUrl: '/images/logo/party-placeholder.svg',
            groupImages: ['/images/logo/party-placeholder.svg'],
            mobileHeroImages: ['/images/logo/party-placeholder.svg'],
            officialImageUrl: '/images/logo/party-placeholder.svg',

            members: samoMembers,
            slogan: 'สโลแกนตัวอย่างของพรรคตัวอย่าง',
            logoMeaning: 'คำอธิบายโลโก้ตัวอย่าง ใช้ทดสอบการแสดงผลเท่านั้น',
            missions: [
                'พันธกิจตัวอย่างข้อที่ 1',
                'พันธกิจตัวอย่างข้อที่ 2',
                'พันธกิจตัวอย่างข้อที่ 3'
            ],
            policies: [
                'นโยบายตัวอย่างข้อ 1 ข้อความตัวอย่างสำหรับทดสอบการแสดงผล',
                'นโยบายตัวอย่างข้อ 2 ข้อความตัวอย่างสำหรับทดสอบการแสดงผล',
                'นโยบายตัวอย่างข้อ 3 ข้อความตัวอย่างสำหรับทดสอบการแสดงผล',
                'นโยบายตัวอย่างข้อ 4 ข้อความตัวอย่างสำหรับทดสอบการแสดงผล'
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
                
                const imagePath = '/images/logo/party-placeholder.svg';

                // Modal - Default to .jpg unless present in map
                
                const modalImagePath = '/images/logo/party-placeholder.svg';

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

    // 6. เสก User 2,000 คน (Voters - All Unvoted)
    const votersCount = 2000;
    console.log(`Populating ${votersCount} UNVOTED voters...`);

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
    const reservedAdminIds = ['9950000101', '9950000102'];

    const usersDataBatch = [];

    for (let i = 0; i < votersCount; i++) {
        const selectedMajor = majorData[Math.floor(Math.random() * majorData.length)];
        const randomYear = years[Math.floor(Math.random() * years.length)];
        const randomGender = genders[Math.floor(Math.random() * genders.length)];
        const runningNumber = String(i).padStart(4, '0');
        const realStudentId = `99${'1051'}${runningNumber}`;

        // เช็คว่า ID ที่สุ่มได้ ไปชนกับ Admin หรือไม่
        if (reservedAdminIds.includes(realStudentId)) {
            continue;
        }

        // กำหนดคำนำหน้าชื่อ
        const titleName = randomGender === 'M' ? 'นาย' : 'นางสาว';

        // Mapping YearStatus
        const yearStatusMap = { 'ปี 1': '1', 'ปี 2': '2', 'ปี 3': '3', 'ปี 4': '4' };
        const yearStatus = yearStatusMap[randomYear] || '1';

        usersDataBatch.push({
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

            isVoted: false,                      // ทุกคนยังไม่โหวต
            isAdmin: false
        });
    }

    // Use createMany for speed
    await prisma.user.createMany({
        data: usersDataBatch,
        skipDuplicates: true,
    });

    console.log(`✅ ${votersCount} UNVOTED Voters created.`);

    // 7. สร้าง Admin Users
    console.log('✨ Creating Admins...');

    // รหัสผ่านแอดมินเป็น "รหัสกลาง" ตัวเดียวใน SystemConfig สุ่มใหม่ทุกครั้งที่ seed
    // แล้วพิมพ์ออกมาครั้งเดียว (วิธีเดียวกับ prisma/seed.js)
    const bcrypt = require('bcryptjs');
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
                studentId: '9950000101',
                name: 'ผู้ดูแลระบบ 1',
                email: 'admin1@example.test',
                gender: 'M', major: 'BIS', year: 'ปี 3',
                yearStatus: '3',
                isVoted: false,
                role: 'ADMIN',
                isAdmin: true,
            },
            {
                studentId: '9950000102',
                name: 'ผู้ดูแลระบบ 2',
                email: 'admin2@example.test',
                gender: 'F', major: 'BIS', year: 'ปี 3',
                yearStatus: '3',
                isVoted: false,
                role: 'ADMIN',
                isAdmin: true,
            }
        ]
    });

    console.log(`✅ Seeded complete!`);
    console.log(`   รหัสกลาง (แสดงครั้งเดียว): ${seedAdminPassword}`);
    console.log(`   เปลี่ยนใหม่: node scripts/admin.js --rotate-password`);
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
