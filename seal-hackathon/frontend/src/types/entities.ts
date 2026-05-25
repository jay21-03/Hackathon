export interface User {
  id: number;
  email: string;
  fullName?: string;
  studentId?: string;
  university?: string;
  status?: string;
}

export interface Event {
  id: number;
  name: string;
  maxTeams: number;
  minTeamSize: number;
  maxTeamSize: number;
  status: string;
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

export interface AiReview {
  id: number;
  teamId: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  reviewScore?: number;
  reviewedAt?: string;
}
