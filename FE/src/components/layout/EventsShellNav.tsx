import { NavLink } from "react-router-dom";
import { getAuthSession, isAuthenticated } from "../../auth/authSession";

/** Điều hướng trang chủ — không gian thi chỉ mở từ thẻ hackathon. */
export function EventsShellNav() {
  const authenticated = isAuthenticated();
  const session = getAuthSession();

  if (!authenticated) return null;

  const isParticipant = session.role === "participant";

  return (
    <nav className="flex flex-wrap items-center gap-1">
      <NavLink
        to="/events"
        end
        className={({ isActive }) =>
          `rounded-lg px-3 py-2 font-label-md ${
            isActive
              ? "bg-primary-container text-on-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          }`
        }
      >
        Trang chủ
      </NavLink>
      {isParticipant ? (
        <>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 font-label-md ${
                isActive
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`
            }
          >
            Hồ sơ
          </NavLink>
          <NavLink
            to="/team-invitations/status"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 font-label-md ${
                isActive
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`
            }
          >
            Lời mời
          </NavLink>
        </>
      ) : null}
    </nav>
  );
}
