#!/usr/bin/env node
/**
 * Import Students Script
 * 
 * รองรับการ import ข้อมูลนักศึกษาจากไฟล์ CSV หรือ Excel (xlsx)
 * ที่มหาวิทยาลัยส่งมาให้
 * 
 * Usage:
 *   node scripts/import-students.js <path-to-file>
 * 
 * Example:
 *   node scripts/import-students.js ./data/students.csv
 *   node scripts/import-students.js ./data/students.xlsx
 * 
 * Expected columns from university dump:
 *   - studentId
 *   - titleName
 *   - studNameThai
 *   - studSnameThai
 *   - yearStatus
 *   - gender
 *   - subKeyid
 *   - subMajorId
 *   - subMajorNameThai
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ============================================
// Utility Functions
// ============================================

/**
 * Parse CSV content into array of objects
 */
function parseCSV(content) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length === 0) return [];

    // Get headers from first line
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            data.push(row);
        }
    }

    return data;
}

/**
 * Parse a single CSV line (handles quoted values)
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());

    return values;
}

/**
 * Parse Excel file using ExcelJS
 */
async function parseExcel(filePath) {
    try {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.worksheets[0];
        const data = [];

        // Get headers from first row
        const headers = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber - 1] = cell.value ? String(cell.value).trim() : '';
        });

        // Get data from remaining rows
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row

            const rowData = {};
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                    rowData[header] = cell.value ? String(cell.value).trim() : '';
                }
            });

            // Only add row if it has data
            if (Object.keys(rowData).length > 0) {
                data.push(rowData);
            }
        });

        return data;
    } catch (error) {
        console.error('❌ ไม่สามารถอ่านไฟล์ Excel ได้');
        console.error(`   Error: ${error.message}`);
        console.error('   กรุณาติดตั้ง exceljs package: npm install exceljs');
        console.error('   หรือแปลงไฟล์เป็น CSV แล้วใช้งานแทน');
        process.exit(1);
    }
}

/**
 * Normalize field names to handle different naming conventions
 */
function normalizeRow(row) {
    // Map possible column names to our standard names
    const fieldMappings = {
        studentId: ['studentId', 'StudentId', 'student_id', 'studentid', 'รหัสนักศึกษา'],
        titleName: ['titleName', 'TitleName', 'title_name', 'titlename', 'คำนำหน้า'],
        studNameThai: ['studNameThai', 'StudNameThai', 'stud_name_thai', 'studnamethai', 'ชื่อ'],
        studSnameThai: ['studSnameThai', 'StudSnameThai', 'stud_sname_thai', 'studsnamthai', 'นามสกุล'],
        yearStatus: ['yearStatus', 'YearStatus', 'year_status', 'yearstatus', 'ชั้นปี'],
        gender: ['gender', 'Gender', 'เพศ'],
        subKeyid: ['subKeyid', 'SubKeyid', 'sub_keyid', 'subkeyid', 'รหัสสาขา'],
        subMajorId: ['subMajorId', 'SubMajorId', 'sub_major_id', 'submajorid'],
        subMajorNameThai: ['subMajorNameThai', 'SubMajorNameThai', 'sub_major_name_thai', 'ชื่อสาขา'],
    };

    const normalized = {};

    for (const [standardName, possibleNames] of Object.entries(fieldMappings)) {
        for (const possibleName of possibleNames) {
            if (row[possibleName] !== undefined) {
                normalized[standardName] = String(row[possibleName]).trim();
                break;
            }
        }
    }

    return normalized;
}

/**
 * Map gender from Thai/English to standard format
 */
function normalizeGender(gender) {
    if (!gender) return null;

    const genderLower = gender.toLowerCase().trim();

    // Male
    if (genderLower === 'm' || genderLower === 'male' || genderLower === 'ชาย') {
        return 'ชาย';
    }

    // Female
    if (genderLower === 'f' || genderLower === 'female' || genderLower === 'หญิง') {
        return 'หญิง';
    }

    return 'อื่นๆ';
}

/**
 * Map yearStatus to standard format
 */
function normalizeYear(yearStatus) {
    if (!yearStatus) return null;

    const year = String(yearStatus).trim();

    // Handle numeric values (1, 2, 3, 4...)
    if (/^[1-4]$/.test(year)) {
        return `ปี ${year}`;
    }

    // Already in "ปี X" format
    if (/^ปี\s*[1-4]$/.test(year)) {
        return year;
    }

    // Other cases
    return 'อื่นๆ / ปีสูง';
}

/**
 * Build full name from components
 */
function buildFullName(titleName, firstName, lastName) {
    // Thai convention attaches the title to the given name and separates the
    // surname with a space: "นายสมชาย ใจดี". Joining all three with '' produced
    // "นายสมชายใจดี" for every imported student — invisible until the first real
    // registrar file lands, then wrong on every name in the system at once.
    const given = [titleName, firstName].filter(Boolean).join('');
    return [given, lastName].filter(Boolean).join(' ') || null;
}

// ============================================
// Main Import Function
// ============================================

async function importStudents(filePath) {
    console.log('\n📚 FMS Election - Student Import Script');
    console.log('=========================================\n');

    // Validate file exists
    if (!fs.existsSync(filePath)) {
        console.error(`❌ ไม่พบไฟล์: ${filePath}`);
        process.exit(1);
    }

    const ext = path.extname(filePath).toLowerCase();
    let data = [];

    // Parse file based on extension
    console.log(`📄 กำลังอ่านไฟล์: ${filePath}`);

    if (ext === '.csv') {
        const content = fs.readFileSync(filePath, 'utf-8');
        data = parseCSV(content);
    } else if (ext === '.xlsx' || ext === '.xls') {
        data = await parseExcel(filePath);
    } else {
        console.error(`❌ ไม่รองรับไฟล์นามสกุล: ${ext}`);
        console.error('   รองรับเฉพาะ .csv, .xlsx, .xls');
        process.exit(1);
    }

    console.log(`✅ พบข้อมูล ${data.length} รายการ\n`);

    if (data.length === 0) {
        console.error('❌ ไม่พบข้อมูลในไฟล์');
        process.exit(1);
    }

    // Show sample data
    console.log('📋 ตัวอย่างข้อมูล (5 รายการแรก):');
    console.log('-----------------------------------');
    data.slice(0, 5).forEach((row, i) => {
        const normalized = normalizeRow(row);
        console.log(`${i + 1}. ${normalized.studentId} - ${normalized.studNameThai || ''} ${normalized.studSnameThai || ''} (${normalized.subKeyid || 'N/A'})`);
    });
    console.log('-----------------------------------\n');

    // Process and import
    console.log('🔄 กำลัง Import ข้อมูล...\n');

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of data) {
        const normalized = normalizeRow(row);

        // Skip if no studentId
        if (!normalized.studentId) {
            skipped++;
            continue;
        }

        try {
            const fullName = buildFullName(
                normalized.titleName,
                normalized.studNameThai,
                normalized.studSnameThai
            );

            const userData = {
                name: fullName,
                titleName: normalized.titleName || null,
                gender: normalizeGender(normalized.gender),
                year: normalizeYear(normalized.yearStatus),
                yearStatus: normalized.yearStatus || null, // เพิ่ม field yearStatus
                // เก็บ subKeyid ทั้งใน major และ subKeyId
                major: normalized.subKeyid || null,
                subKeyId: normalized.subKeyid || null,
                subMajorId: normalized.subMajorId || null,
                subMajorNameThai: normalized.subMajorNameThai || null,
            };

            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { studentId: normalized.studentId }
            });

            if (existingUser) {
                // Update - only update fields that are null in DB
                const updateData = {};

                for (const [key, value] of Object.entries(userData)) {
                    if (value !== null && (existingUser[key] === null || existingUser[key] === undefined)) {
                        updateData[key] = value;
                    }
                }

                // Always update these fields from dump file (they're more accurate)
                if (userData.major) updateData.major = userData.major;
                if (userData.subKeyId) updateData.subKeyId = userData.subKeyId;
                if (userData.subMajorId) updateData.subMajorId = userData.subMajorId;
                if (userData.subMajorNameThai) updateData.subMajorNameThai = userData.subMajorNameThai;

                if (Object.keys(updateData).length > 0) {
                    await prisma.user.update({
                        where: { studentId: normalized.studentId },
                        data: updateData
                    });
                    updated++;
                } else {
                    skipped++;
                }
            } else {
                // Create new user
                await prisma.user.create({
                    data: {
                        studentId: normalized.studentId,
                        ...userData,
                        role: 'student',
                        isVoted: false,
                        isFormCompleted: false,
                        isAdmin: false
                    }
                });
                created++;
            }

        } catch (error) {
            console.error(`❌ Error importing ${normalized.studentId}: ${error.message}`);
            errors++;
        }
    }

    // Summary
    console.log('\n=========================================');
    console.log('📊 สรุปผลการ Import:');
    console.log(`   ✅ สร้างใหม่: ${created} รายการ`);
    console.log(`   🔄 อัปเดต: ${updated} รายการ`);
    console.log(`   ⏭️  ข้าม: ${skipped} รายการ`);
    console.log(`   ❌ Error: ${errors} รายการ`);
    console.log('=========================================\n');

    // A file whose headers this script does not recognise skips every row and
    // still reports "Error: 0", which reads like success. Say so plainly — the
    // caller is usually importing the voter roll, and an empty import is the
    // difference between an election and no election.
    if (created === 0 && updated === 0 && skipped > 0) {
        console.log('⚠️  ไม่ได้นำเข้าข้อมูลสักรายการ — ข้ามทั้งหมด ' + skipped + ' แถว');
        console.log('   สาเหตุที่พบบ่อยคืออ่านหัวคอลัมน์ไม่ออก ตรวจว่าไฟล์มีคอลัมน์เหล่านี้:');
        console.log('   studentId · titleName · studNameThai · studSnameThai · yearStatus');
        console.log('   (หัวคอลัมน์ภาษาไทยก็ได้: รหัสนักศึกษา · คำนำหน้า · ชื่อ · นามสกุล · ชั้นปี)\n');
        process.exitCode = 1;
    }
}

// ============================================
// CLI Entry Point
// ============================================

const args = process.argv.slice(2);

if (args.length === 0) {
    console.log(`
📚 FMS Election - Student Import Script

Usage:
  node scripts/import-students.js <path-to-file>

Examples:
  node scripts/import-students.js ./data/students.csv
  node scripts/import-students.js ./data/students.xlsx

Supported formats:
  - CSV (.csv)
  - Excel (.xlsx, .xls)

Expected columns:
  - studentId
  - titleName
  - studNameThai
  - studSnameThai
  - yearStatus
  - gender
  - subKeyid
  - subMajorId
  - subMajorNameThai
`);
    process.exit(0);
}

const filePath = path.resolve(args[0]);

// $disconnect() is async. Firing it and calling process.exit() in the same tick
// killed the process mid-teardown, which libuv reports as
//   Assertion failed: !(handle->flags & UV_HANDLE_CLOSING) ... async.c line 76
// and an exit code of 127 — "command not found" to anything reading it, even
// though every row had already imported cleanly. Await the disconnect and let
// node exit on its own; set exitCode instead of forcing an immediate exit.
importStudents(filePath)
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error) => {
        console.error('❌ Fatal error:', error);
        await prisma.$disconnect();
        process.exitCode = 1;
    });
