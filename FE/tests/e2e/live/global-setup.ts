import type { FullConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { request as playwrightRequest } from "@playwright/test";
import {
  DEMO_EVENT_ID,
  DEMO_ORGANIZER_EMAIL,
  login,
  waitForBackend
} from "./helpers/liveApi";
import { resolveLiveRole } from "./helpers/liveAuth";

const AUTH_DIR = path.join(__dirname, ".auth");
const ORGANIZER_STATE = path.join(AUTH_DIR, "organizer.json");

async function globalSetup(_config: FullConfig) {
  if (process.env.LIVE_STACK !== "1") {
    return;
  }

  await waitForBackend();

  const request = await playwrightRequest.newContext();
  const session = await login(request, DEMO_ORGANIZER_EMAIL);
  await request.dispose();

  const profile = {
    role: resolveLiveRole(session.roles),
    email: session.email,
    name: session.name
  };

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: "http://127.0.0.1:5173",
        localStorage: [
          { name: "seal.auth.token", value: session.token },
          { name: "seal.auth.session", value: JSON.stringify(profile) },
          { name: "seal.activeEventId", value: String(DEMO_EVENT_ID) }
        ]
      }
    ]
  };

  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(ORGANIZER_STATE, JSON.stringify(storageState, null, 2));
}

export default globalSetup;
