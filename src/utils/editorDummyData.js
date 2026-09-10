// Presentation-only compatibility adapters. Never write these fixtures to the DB.
import { makeParties, SPECIAL } from "./templatePreviewMocks.js";
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


export const DUMMY_PARTIES = makeParties(2).map((p, i) => ({
  ...p, groupImageUrl: p.groupImageUrls[0], voteCount: i === 0 ? 245 : 187,
}));
export const DUMMY_ABSTAIN = { ...SPECIAL.abstain, voteCount: 68 };
export const DUMMY_USER = {
  name: "ผู้ใช้ตัวอย่าง", studentId: "DEMO-0001",
  major: "สาขาวิชาการตลาด", year: "ปี 3", votedAt: "2026-02-06T03:24:07.000Z",
};
export const DUMMY_PARTY_DETAIL = {
  ...DUMMY_PARTIES[0], vision: DUMMY_PARTIES[0].logoMeaning,
  policies: DUMMY_PARTIES[0].policies.map(p => p.title),
  team: DUMMY_PARTIES[0].members.map(m => ({ ...m, role: m.position })),
};
export const DUMMY_PARTIES_SINGLE = DUMMY_PARTIES.slice(0, 1);
export const DUMMY_PARTIES_MULTI = DUMMY_PARTIES;
export const DUMMY_SPECIAL_OPTIONS = {
  abstain: { ...SPECIAL.abstain, voteCount: 68 },
  disapprove: { ...SPECIAL.disapprove, voteCount: 12 },
};
export const DUMMY_RESULTS_MULTI = [
  ...DUMMY_PARTIES.map(p => ({ ...p, score: p.voteCount })),
  { ...SPECIAL.abstain, score: 68 },
];
export const DUMMY_RESULTS_SINGLE = [
  { ...DUMMY_PARTIES[0], score: 312 },
  { ...SPECIAL.abstain, score: 95 },
  { ...SPECIAL.disapprove, score: 43 },
];
// Total votes for percentage calc
export const DUMMY_RESULTS_TOTALS = {
  multi: 500,
  single: 450
};

// Demographics demo data for ResultsEditorPreview
export const DUMMY_RESULTS_DEMOGRAPHICS = {
  totalEligible: 1200,
  byMajor: [
    { name: "บัญชี", value: 142 },
    { name: "การเงิน", value: 98 },
    { name: "การจัดการ", value: 87 },
    { name: "การตลาด", value: 73 },
    { name: "ระบบสารสนเทศ", value: 56 },
    { name: "การจัดการโลจิสติกส์", value: 44 }
  ],
  byYear: [
    { name: "ปี 1", value: 145 },
    { name: "ปี 2", value: 132 },
    { name: "ปี 3", value: 118 },
    { name: "ปี 4", value: 105 }
  ],
  byGender: [
    { name: "Male", value: 234 },
    { name: "Female", value: 266 }
  ]
};
