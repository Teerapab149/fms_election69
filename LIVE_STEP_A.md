# LIVE_STEP_A.md — Shared Utilities (2 new files, nothing else)

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` — specifically the "EXECUTION RULES FOR CLAUDE CODE" section at the bottom. Follow those rules strictly.

## TASK SCOPE (DO NOT EXCEED)
Create exactly 2 new files. Modify zero existing files. Read zero other files.

## FILE 1: `src/utils/styleMaps.js`

Paste this exact content:

```js
// Shared style mapping objects used across editor-aware components.
// Keep in sync with SharedInputs dropdown options.

export const SIZE_MAP = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
  '7xl': '4.5rem'
};

export const RADIUS_MAP = {
  none: '0',
  sm: '0.125rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px'
};

export const WEIGHT_MAP = {
  thin: '100',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900'
};
```

## FILE 2: `src/utils/editorDummyData.js`

Paste this exact content:

```js
// Dummy data for editor preview mode. Matches real API response shapes.
// Update these when the underlying data model changes.

export const DUMMY_ELECTION = {
  title: "SAMO 49",
  subtitle: "โครงการเลือกตั้งคณะกรรมการบริหาร",
  subtitle2: "สโมสรนักศึกษาคณะวิทยาการจัดการ",
  year: 2569,
  endDate: "2027-01-01T00:00:00Z",
  status: "UPCOMING",
  totalVoted: 342,
  totalEligible: 1200,
  percentageVoted: 28.50
};

export const DUMMY_PARTIES = [
  {
    id: 1,
    number: 1,
    name: "The Unity Concord Of FMS 2",
    slogan: "หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน",
    logoUrl: null,
    groupImageUrl: null,
    voteCount: 245,
    color: "#8A2680"
  },
  {
    id: 2,
    number: 2,
    name: "อะไรไม่รู้ครับ",
    slogan: "หกด",
    logoUrl: null,
    groupImageUrl: null,
    voteCount: 187,
    color: "#2563EB"
  }
];

export const DUMMY_ABSTAIN = {
  id: 998,
  number: 0,
  name: "งดออกเสียง",
  voteCount: 68
};

export const DUMMY_USER = {
  name: "Teerapab Boonsri",
  studentId: "6610510149"
};

export const DUMMY_PARTY_DETAIL = {
  id: 1,
  number: 1,
  name: "The Unity Concord Of FMS 2",
  slogan: "หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน",
  logoUrl: null,
  groupImageUrl: null,
  vision: "The Unity Concord of FMS สะท้อนถึงความสำคัญของการรวมตัวกันเป็นหนึ่งเดียวกันในหมู่คณะ เพื่อสร้างความร่วมมือที่มีประสิทธิภาพในการดำเนินกิจกรรมหรือโครงการต่างๆ เพื่อประโยชน์ส่วนรวม",
  policies: [
    "บูรณาการเสริมสร้างองค์ความรู้และพัฒนาเพื่อยกระดับทักษะด้านวิชาชีพรวมถึงกิจกรรมต่างๆ",
    "มุ่งเน้นการสร้างสังคมที่มีความเป็นหนึ่งเดียวจากความหลากหลายและการเคารพสิทธิเพื่อการอยู่ร่วมกันอย่างสันติ",
    "เปิดโอกาสในการแสดงศักยภาพและความสามารถในทุกด้านเพื่อพัฒนาทรัพยากรบุคคลให้เกิดประโยชน์สูงสุด"
  ],
  team: [
    { name: "สมิตานันท์ ธรณสุนทร", role: "นายกสโมสรนักศึกษา", imageUrl: null },
    { name: "สุภัคกานต์ สุทธิพันธ์", role: "อุปนายกฝ่ายกิจการภายใน", imageUrl: null },
    { name: "นันทณัฐ หัสชัย", role: "อุปนายกฝ่ายกิจการภายนอก", imageUrl: null }
  ]
};
```

## VERIFICATION
Run `npm run build`. Must pass with exit code 0.

## REPORT FORMAT
Two lines only:
```
Created src/utils/styleMaps.js — size/radius/weight lookup maps
Created src/utils/editorDummyData.js — fake election/party/user data for previews
```
