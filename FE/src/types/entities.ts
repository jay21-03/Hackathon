export interface User {
  id: number;
  email: string;
  fullName?: string;
  studentId?: string;
  university?: string;
  status?: string;
}

export type AcademicTermType = "SPRING" | "SUMMER" | "FALL";
export type AcademicTermStatus = "ACTIVE" | "ARCHIVED";

export interface AcademicTerm {
  id: number;
  code: string;
  name: string;
  year: number;
  termType: AcademicTermType;
  startDate: string;
  endDate: string;
  status: AcademicTermStatus;
  eventCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventListItem {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  registrationStartAt: string;
  registrationEndAt: string;
  minTeamSize?: number;
  maxTeamSize?: number;
  status: string;
  academicTermId?: number;
  academicTermCode?: string;
  academicTermName?: string;
}

export interface Team {
  id: number;
  eventId: number;
  name: string;
  status: string;
}

export interface TeamMember {
  id: number;
  teamId: number;
  email: string;
  fullName: string;
  status: string;
}

export interface Problem {
  id: number;
  boardId: number;
  title: string;
  releaseAt: string;
  closeAt?: string | null;
}

export interface ScoreSheet {
  id: number;
  boardId: number;
  teamId: number;
  judgeId: number;
  status: "DRAFT" | "SUBMITTED";
}

export interface RankingResult {
  id: number;
  boardId: number;
  teamId: number;
  rank: number;
  averageScore: number;
}
