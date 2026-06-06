import {

  getRoleHome,

  resolveRoleFromApiRoles,

  setAuthenticated,

  setAuthSession,

  type UserRole

} from "../auth/authSession";

import { setAccessToken } from "../auth/tokenStorage";

import type { AuthResponse } from "../services/authService";

import { fetchCurrentUser } from "../services/userService";



export async function finishAuthSession(result: AuthResponse, options?: { from?: string }) {

  setAccessToken(result.accessToken);



  const me = await fetchCurrentUser();



  const role: UserRole = resolveRoleFromApiRoles(me.roles);

  setAuthSession({

    role,

    email: me.email,

    name: me.fullName || me.email

  });

  setAuthenticated(true);

  window.location.href = options?.from ?? getRoleHome(role);

}


