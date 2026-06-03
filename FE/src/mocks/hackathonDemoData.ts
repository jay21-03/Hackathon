import type { ExistingTeamMember, RubricCriterion } from "../domain/businessRules";
import type { EventListItem } from "../types/entities";

export interface DemoEvent {
  id: number;
  name: string;
  quota: number;
  confirmedTeams: number;
  minTeamSize: number;
  maxTeamSize: number;
  releaseAt: string;
  status: string;
}

export interface DemoTeam {
  id: number;
  name: string;
  eventId: number;
  board: string;
  status: string;
  repoUrl?: string;
  aiReviewScore?: number;
  track?: string;
  checkInStatus?: string;
}

export interface DemoScoreSheet {
  id: number;
  teamId: number;
  judge: string;
  status: "DRAFT" | "SUBMITTED";
  total: number;
}

export interface DemoTeamMember {
  id: number;
  teamId: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
}

export interface DemoActivity {
  id: number;
  title: string;
  detail: string;
  status: string;
  time: string;
}

export interface DemoRegistration {
  id: number;
  teamId: number;
  submittedAt: string;
  memberCount: number;
  status: string;
}

export interface DemoCheckIn {
  id: number;
  teamId: number;
  imageUrl: string;
  submittedAt: string;
  status: string;
  note: string;
}

export interface DemoProblem {
  id: number;
  title: string;
  board: string;
  releaseAt: string;
  durationHours: number;
  status: string;
  summary: string;
  requirements: string[];
}

export interface DemoUserRole {
  id: number;
  fullName: string;
  email: string;
  role: "participant" | "organizer" | "mentor" | "judge";
  status: string;
}

export interface DemoBoard {
  id: number;
  name: string;
  round: string;
  teamIds: number[];
  mentor: string;
  judges: string[];
  status: string;
}

export interface DemoInvitation {
  id: number;
  email: string;
  role: "mentor" | "judge";
  board: string;
  status: string;
  sentAt: string;
}

export interface DemoAnnouncement {
  id: number;
  title: string;
  audience: string;
  status: string;
  scheduledAt: string;
}

export interface DemoViolation {
  id: number;
  teamId: number;
  reason: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: string;
}

export interface DemoAiFinding {
  id: number;
  teamId: number;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: string;
  detail: string;
}

export const demoEvent: DemoEvent = {
  id: 1,
  name: "SEAL Hackathon 2026",
  quota: 50,
  confirmedTeams: 49,
  minTeamSize: 1,
  maxTeamSize: 5,
  releaseAt: "2026-07-12T09:00:00+07:00",
  status: "OPEN"
};

export const demoPublicEvents: EventListItem[] = [
  {
    id: 1,
    name: demoEvent.name,
    startDate: "2026-07-12T08:00:00+07:00",
    endDate: "2026-07-14T18:00:00+07:00",
    registrationStartAt: "2026-06-10T08:00:00+07:00",
    registrationEndAt: "2026-07-05T23:59:00+07:00",
    status: "OPEN"
  },
  {
    id: 2,
    name: "AI Innovation Challenge",
    startDate: "2026-08-02T08:00:00+07:00",
    endDate: "2026-08-03T18:00:00+07:00",
    registrationStartAt: "2026-06-20T08:00:00+07:00",
    registrationEndAt: "2026-07-25T23:59:00+07:00",
    status: "UPCOMING"
  },
  {
    id: 3,
    name: "Sustainable Tech Sprint",
    startDate: "2026-05-18T08:00:00+07:00",
    endDate: "2026-05-20T18:00:00+07:00",
    registrationStartAt: "2026-04-01T08:00:00+07:00",
    registrationEndAt: "2026-05-10T23:59:00+07:00",
    status: "ENDED"
  }
];

export const existingTeamMembers: ExistingTeamMember[] = [
  {
    eventId: 1,
    email: "alex@seal.edu.vn",
    teamName: "Quantum Nexus"
  },
  {
    eventId: 1,
    email: "sarah@seal.edu.vn",
    teamName: "Quantum Nexus"
  },
  {
    eventId: 1,
    email: "mentor@seal.edu.vn",
    teamName: "DataStream Pro"
  }
];

export const demoTeams: DemoTeam[] = [
  {
    id: 42,
    name: "Quantum Nexus",
    eventId: 1,
    board: "Bang Alpha",
    status: "CONFIRMED",
    repoUrl: "https://github.com/seal/quantum-nexus",
    aiReviewScore: 86,
    track: "AI / LLM Tooling",
    checkInStatus: "CONFIRMED"
  },
  {
    id: 87,
    name: "DataStream Pro",
    eventId: 1,
    board: "Bang Alpha",
    status: "CONFIRMED",
    repoUrl: "https://github.com/seal/datastream-pro",
    aiReviewScore: 74,
    track: "Fintech & DeFi",
    checkInStatus: "PENDING"
  },
  {
    id: 112,
    name: "Neural Net Ninjas",
    eventId: 1,
    board: "Bang Beta",
    status: "WAITLIST",
    repoUrl: "https://github.com/seal/neural-net-ninjas",
    aiReviewScore: 91,
    track: "AI / LLM Tooling",
    checkInStatus: "PENDING"
  },
  {
    id: 23,
    name: "EcoChain",
    eventId: 1,
    board: "Bang Beta",
    status: "CONFIRMED",
    repoUrl: "https://github.com/seal/ecochain",
    aiReviewScore: 65,
    track: "Sustainability",
    checkInStatus: "REJECTED"
  }
];

export const demoTeamMembers: DemoTeamMember[] = [
  {
    id: 1,
    teamId: 42,
    fullName: "Alex Nguyen",
    email: "alex@seal.edu.vn",
    role: "Doi truong",
    status: "CONFIRMED"
  },
  {
    id: 2,
    teamId: 42,
    fullName: "Sarah Tran",
    email: "sarah@seal.edu.vn",
    role: "Frontend",
    status: "CONFIRMED"
  },
  {
    id: 3,
    teamId: 42,
    fullName: "Minh Khoa",
    email: "minh@seal.edu.vn",
    role: "Ky thuat",
    status: "CONFIRMED"
  },
  {
    id: 4,
    teamId: 42,
    fullName: "Linh Pham",
    email: "linh@seal.edu.vn",
    role: "Product",
    status: "PENDING"
  }
];

export const participantActivities: DemoActivity[] = [
  {
    id: 1,
    title: "Dang ky doi",
    detail: "Quantum Nexus da duoc xac nhan tham gia.",
    status: "CONFIRMED",
    time: "08:30"
  },
  {
    id: 2,
    title: "Check-in",
    detail: "Anh check-in da duoc duyet.",
    status: "CONFIRMED",
    time: "09:05"
  },
  {
    id: 3,
    title: "Bai nop",
    detail: "Kho ma nguon da co link va san sang cho danh gia AI.",
    status: "SUBMITTED",
    time: "10:20"
  }
];

export const organizerActivities: DemoActivity[] = [
  {
    id: 1,
    title: "Dang ky sap day quota",
    detail: "49/50 doi da duoc xac nhan.",
    status: "WAITLIST",
    time: "08:15"
  },
  {
    id: 2,
    title: "Cham diem",
    detail: "6 phieu cham da chot, 2 ban nhap chua tinh diem.",
    status: "SUBMITTED",
    time: "09:45"
  },
  {
    id: 3,
    title: "Ket qua",
    detail: "Chua cong bo ra cong ket qua cong khai.",
    status: "DRAFT",
    time: "10:30"
  }
];

export const demoRegistrations: DemoRegistration[] = [
  {
    id: 1001,
    teamId: 42,
    submittedAt: "2026-06-10T09:10:00+07:00",
    memberCount: 4,
    status: "CONFIRMED"
  },
  {
    id: 1002,
    teamId: 87,
    submittedAt: "2026-06-10T09:35:00+07:00",
    memberCount: 3,
    status: "PENDING"
  },
  {
    id: 1003,
    teamId: 112,
    submittedAt: "2026-06-10T10:05:00+07:00",
    memberCount: 5,
    status: "WAITLIST"
  },
  {
    id: 1004,
    teamId: 23,
    submittedAt: "2026-06-10T10:40:00+07:00",
    memberCount: 2,
    status: "REJECTED"
  }
];

export const demoCheckIns: DemoCheckIn[] = [
  {
    id: 2001,
    teamId: 42,
    imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952",
    submittedAt: "2026-07-12T08:10:00+07:00",
    status: "CONFIRMED",
    note: "Anh ro mat day du thanh vien."
  },
  {
    id: 2002,
    teamId: 87,
    imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72",
    submittedAt: "2026-07-12T08:20:00+07:00",
    status: "PENDING",
    note: "Can ban to chuc xem lai so thanh vien."
  },
  {
    id: 2003,
    teamId: 23,
    imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978",
    submittedAt: "2026-07-12T08:40:00+07:00",
    status: "REJECTED",
    note: "Anh bi mo, yeu cau nop lai."
  }
];

export const demoProblem: DemoProblem = {
  id: 301,
  title: "Nen tang dieu phoi mentor va cham diem hackathon",
  board: "Bang Alpha",
  releaseAt: demoEvent.releaseAt,
  durationHours: 36,
  status: "PUBLISHED",
  summary:
    "Xay dung ung dung ho tro ban to chuc phan bang, mentor theo doi doi thi va judge cham diem minh bach.",
  requirements: [
    "Quan ly doi thi va thanh vien theo tung cuoc thi.",
    "Nop repository va hien thi trang thai danh gia AI.",
    "Cham diem theo tieu chi, co ban nhap va lan chot chinh thuc.",
    "Xep hang chi tinh phieu cham da chot."
  ]
};

export const demoUsers: DemoUserRole[] = [
  { id: 1, fullName: "Alex Nguyen", email: "alex@seal.edu.vn", role: "participant", status: "CONFIRMED" },
  { id: 2, fullName: "Mai Tran", email: "mai@seal.edu.vn", role: "organizer", status: "CONFIRMED" },
  { id: 3, fullName: "Dr. Chen", email: "chen@seal.edu.vn", role: "judge", status: "CONFIRMED" },
  { id: 4, fullName: "An Le", email: "an.mentor@seal.edu.vn", role: "mentor", status: "PENDING" },
  { id: 5, fullName: "S. Malik", email: "malik@seal.edu.vn", role: "judge", status: "CONFIRMED" }
];

export const demoBoards: DemoBoard[] = [
  {
    id: 1,
    name: "Bang Alpha",
    round: "Vong so loai",
    teamIds: [42, 87],
    mentor: "An Le",
    judges: ["Dr. Chen", "S. Malik", "J. Doe"],
    status: "PUBLISHED"
  },
  {
    id: 2,
    name: "Bang Beta",
    round: "Vong so loai",
    teamIds: [112, 23],
    mentor: "Linh Vu",
    judges: ["A. Rivera", "R. Kim"],
    status: "DRAFT"
  }
];

export const demoInvitations: DemoInvitation[] = [
  { id: 1, email: "an.mentor@seal.edu.vn", role: "mentor", board: "Bang Alpha", status: "PENDING", sentAt: "2026-06-12T08:30:00+07:00" },
  { id: 2, email: "chen@seal.edu.vn", role: "judge", board: "Bang Alpha", status: "CONFIRMED", sentAt: "2026-06-12T08:40:00+07:00" },
  { id: 3, email: "rivera@seal.edu.vn", role: "judge", board: "Bang Beta", status: "PENDING", sentAt: "2026-06-12T09:05:00+07:00" }
];

export const demoAnnouncements: DemoAnnouncement[] = [
  { id: 1, title: "Mo check-in tu 08:00", audience: "Tat ca doi thi", status: "PUBLISHED", scheduledAt: "2026-07-12T07:30:00+07:00" },
  { id: 2, title: "De thi se mo dung 09:00", audience: "Thi sinh", status: "DRAFT", scheduledAt: "2026-07-12T08:45:00+07:00" },
  { id: 3, title: "Lich thuyet trinh chung ket", audience: "Finalist", status: "PENDING", scheduledAt: "2026-07-13T16:00:00+07:00" }
];

export const demoViolations: DemoViolation[] = [
  { id: 1, teamId: 23, reason: "Anh check-in khong hop le", severity: "LOW", status: "PENDING" },
  { id: 2, teamId: 112, reason: "Repository co dau hieu copy code", severity: "HIGH", status: "PENDING" }
];

export const demoAiFindings: DemoAiFinding[] = [
  {
    id: 1,
    teamId: 42,
    title: "Kien truc ro rang",
    severity: "LOW",
    status: "COMPLETED",
    detail: "Cau truc module de review, test coverage kha tot."
  },
  {
    id: 2,
    teamId: 112,
    title: "Can review thu cong",
    severity: "HIGH",
    status: "PENDING",
    detail: "Mot so file co diem tuong dong cao voi repository cong khai."
  }
];

export const baseRubric: RubricCriterion[] = [
  { name: "Tinh dung van de", min: 0, max: 10, score: 8 },
  { name: "Ky thuat va kien truc", min: 0, max: 10, score: 8 },
  { name: "Trai nghiem nguoi dung", min: 0, max: 10, score: 7 },
  { name: "Tinh sang tao", min: 0, max: 10, score: 8 },
  { name: "Thuyet trinh", min: 0, max: 10, score: 7 }
];

export const demoScoreSheets: DemoScoreSheet[] = [
  { id: 1, teamId: 42, judge: "Dr. Chen", status: "SUBMITTED", total: 43 },
  { id: 2, teamId: 42, judge: "S. Malik", status: "SUBMITTED", total: 41 },
  { id: 3, teamId: 42, judge: "J. Doe", status: "SUBMITTED", total: 44 },
  { id: 4, teamId: 87, judge: "Dr. Chen", status: "SUBMITTED", total: 38 },
  { id: 5, teamId: 87, judge: "S. Malik", status: "SUBMITTED", total: 40 },
  { id: 6, teamId: 87, judge: "J. Doe", status: "DRAFT", total: 37 },
  { id: 7, teamId: 112, judge: "A. Rivera", status: "DRAFT", total: 42 },
  { id: 8, teamId: 23, judge: "R. Kim", status: "SUBMITTED", total: 36 }
];

export function getSubmittedAverage(teamId: number) {
  const submitted = demoScoreSheets.filter(
    (sheet) => sheet.teamId === teamId && sheet.status === "SUBMITTED"
  );
  if (submitted.length === 0) return null;
  const total = submitted.reduce((sum, sheet) => sum + sheet.total, 0);
  return Number((total / submitted.length).toFixed(1));
}

export function getRankingRows() {
  return demoTeams
    .map((team) => {
      const averageScore = getSubmittedAverage(team.id);
      const submittedCount = demoScoreSheets.filter(
        (sheet) => sheet.teamId === team.id && sheet.status === "SUBMITTED"
      ).length;
      return {
        team,
        averageScore,
        submittedCount
      };
    })
    .sort((a, b) => (b.averageScore ?? -1) - (a.averageScore ?? -1));
}

export function getTeamById(teamId: number) {
  return demoTeams.find((team) => team.id === teamId);
}

export function getScoringProgressRows() {
  return demoTeams.map((team) => {
    const sheets = demoScoreSheets.filter((sheet) => sheet.teamId === team.id);
    const submitted = sheets.filter((sheet) => sheet.status === "SUBMITTED").length;
    return {
      team,
      totalSheets: sheets.length,
      submitted,
      draft: sheets.length - submitted,
      complete: sheets.length > 0 && submitted === sheets.length
    };
  });
}
