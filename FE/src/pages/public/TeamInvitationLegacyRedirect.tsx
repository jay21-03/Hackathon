import { Navigate, useSearchParams } from "react-router-dom";



/** Chuyển URL cũ `/team-invitation?token=` sang luồng email `/team-invitations/accept`. */

export function TeamInvitationLegacyRedirect() {

  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  if (!token) {

    return <Navigate to="/events" replace />;

  }

  return (

    <Navigate

      to={`/team-invitations/accept?token=${encodeURIComponent(token)}`}

      replace

    />

  );

}


