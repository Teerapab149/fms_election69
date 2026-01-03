// src/utils/studentHelper.js

export function processStudentData(apiData) {
  const { StudentID, StudentName, DepartmentID } = apiData;

  // 1. หาเพศจากคำนำหน้า
  let gender = "อื่นๆ";
  const lowerName = StudentName.toLowerCase();
  
  if (StudentName.startsWith("นาย") || lowerName.startsWith("mr.")) {
    gender = "ชาย";
  } else if (
    StudentName.startsWith("นาง") || 
    StudentName.startsWith("น.ส.") || 
    StudentName.startsWith("นางสาว") || 
    lowerName.startsWith("miss") || 
    lowerName.startsWith("ms.") || 
    lowerName.startsWith("mrs.")
  ) {
    gender = "หญิง";
  }

  // 2. แปลงรหัสสาขา (ตัวอย่างสมมติ - คุณต้องแก้เลขตามจริงของ PSU)
  const deptMapping = {
    "01": "PA",
    "02": "BBA",
    "03": "ACC",
    "04": "HRM",
    "05": "LSM",
    "06": "FIN",
    "07": "MKT",
    "08": "BIS",
    "09": "MICE"
    
  };
  
  // ถ้าหารหัสไม่เจอ ให้ใส่ว่า "ไม่ระบุสาขา" หรือใส่รหัสนั้นไปเลย
  const major = deptMapping[DepartmentID] || `สาขาอื่น (${DepartmentID})`;

// 3. หาชั้นปี (Logic แบบเหมาเข่ง)
  const yearCode = StudentID.substring(0, 2); 
  const currentYear = 68; // ⚠️ แก้เลขนี้ตามปีการศึกษาปัจจุบัน (เช่น ปีนี้ 2568 เด็กปี 1 คือรหัส 68)
  
  const studentYear = parseInt(yearCode); // แปลงรหัสเป็นตัวเลขเพื่อคำนวณ
  let year = "";

  // ถ้าเป็นรหัสปัจจุบัน หรือย้อนหลังไป 3 ปี (ปี 1 - ปี 4)
  if (studentYear === currentYear) {
    year = "ปี 1";
  } else if (studentYear === currentYear - 1) {
    year = "ปี 2";
  } else if (studentYear === currentYear - 2) {
    year = "ปี 3";
  } else if (studentYear === currentYear - 3) {
    year = "ปี 4";
  } else {
    // 🧹 กวาดทุกอย่างที่เหลือ (ป.โท, เด็กเปอร์, เด็กซิ่วรหัสเก่า) มาลงที่นี่
    year = "อื่นๆ / ปีสูง"; 
  }

  return {
    studentId: StudentID,
    name: StudentName,
    gender: gender,
    major: major,
    year: year,
    email: apiData.Email,
    facultyId: apiData.FacultyID
  };
}