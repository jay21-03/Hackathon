import type { APIRequestContext } from "@playwright/test";

export const E2E_DEMO_PASSWORD = "E2ePass123!";
export const DEMO_ORGANIZER_EMAIL = "organizer@seal.edu.vn";
export const DEMO_EVENT_ID = 11;
export const DEMO_FROM_ROUND_ID = 21;
export const DEMO_TO_ROUND_ID = 22;
export const DEMO_PENDING_TEAM_ID = 42;

const API_BASE = process.env.E2E_API_BASE ?? "http://127.0.0.1:8085/api/v1";

export async function waitForBackend(timeoutMs = 120_000) {
  const started = Date.now();
  let lastError = "unknown";
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${API_BASE.replace("/api/v1", "")}/actuator/health`);
      if (response.ok) {
        const body = (await response.json()) as { status?: string };
        if (body.status === "UP") return;
      }
      lastError = `health status ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Backend not ready at ${API_BASE}: ${lastError}`);
}

export async function login(request: APIRequestContext, email: string, password = E2E_DEMO_PASSWORD) {
  const response = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password }
  });
  if (!response.ok()) {
    throw new Error(`Login failed for ${email}: ${response.status()} ${await response.text()}`);
  }
  const body = await response.json();
  const token = body?.data?.accessToken as string | undefined;
  if (!token) {
    throw new Error(`Login response missing accessToken for ${email}`);
  }
  const meResponse = await request.get(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meBody = await meResponse.json();
  return {
    token,
    email: meBody?.data?.email as string,
    name: (meBody?.data?.fullName as string) ?? email,
    roles: (meBody?.data?.roles as string[]) ?? []
  };
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchAdvancementPreview(
  request: APIRequestContext,
  token: string,
  eventId = DEMO_EVENT_ID,
  fromRoundId = DEMO_FROM_ROUND_ID,
  toRoundId = DEMO_TO_ROUND_ID
) {
  const response = await request.get(
    `${API_BASE}/admin/events/${eventId}/advancements/preview?fromRoundId=${fromRoundId}&toRoundId=${toRoundId}&topNPerBoard=1`,
    { headers: authHeaders(token) }
  );
  if (!response.ok()) {
    throw new Error(`Advancement preview failed: ${response.status()} ${await response.text()}`);
  }
  const body = await response.json();
  return body.data as { candidates: Array<{ teamName: string; teamId: number }> };
}

export async function closeEventRegistration(
  request: APIRequestContext,
  token: string,
  eventId = DEMO_EVENT_ID
) {
  const response = await request.post(`${API_BASE}/admin/events/${eventId}/close-registration`, {
    headers: authHeaders(token)
  });
  if (!response.ok()) {
    throw new Error(`Close registration failed: ${response.status()} ${await response.text()}`);
  }
  const body = await response.json();
  return body.data as { status?: string };
}

export async function openEventRegistration(
  request: APIRequestContext,
  token: string,
  eventId = DEMO_EVENT_ID
) {
  const response = await request.post(`${API_BASE}/admin/events/${eventId}/open-registration`, {
    headers: authHeaders(token)
  });
  if (!response.ok()) {
    throw new Error(`Open registration failed: ${response.status()} ${await response.text()}`);
  }
  const body = await response.json();
  return body.data as { status?: string };
}

export async function patchTeamStatus(
  request: APIRequestContext,
  token: string,
  teamId: number,
  status: string,
  reason?: string
) {
  const response = await request.patch(`${API_BASE}/teams/${teamId}/status`, {
    headers: authHeaders(token),
    data: reason ? { status, reason } : { status }
  });
  if (!response.ok()) {
    throw new Error(`Patch team status failed: ${response.status()} ${await response.text()}`);
  }
  const body = await response.json();
  return body.data as { id: number; status: string };
}

export async function fetchTeamSummary(
  request: APIRequestContext,
  token: string,
  eventId = DEMO_EVENT_ID
) {
  const response = await request.get(`${API_BASE}/events/${eventId}/teams/summary`, {
    headers: authHeaders(token)
  });
  if (!response.ok()) {
    throw new Error(`Team summary failed: ${response.status()} ${await response.text()}`);
  }
  const body = await response.json();
  return body.data as {
    confirmedCount: number;
    pendingCount: number;
    awaitingApprovalCount: number;
    waitlistCount: number;
  };
}
