import { Link, Outlet } from "react-router-dom";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/events", label: "Events" },
  { to: "/me/team", label: "My Team" },
  { to: "/organizer/dashboard", label: "Organizer" },
  { to: "/judge/dashboard", label: "Judge" },
  { to: "/mentor/dashboard", label: "Mentor" }
];

export function AppLayout() {
  return (
    <div className="layout">
      <header className="topbar">
        <h1>SEAL Hackathon Management</h1>
        <nav>
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
