import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/rooms", label: "Rooms" },
  { to: "/boarders", label: "Boarders" },
  { to: "/payments", label: "Payments" },
];

export function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>BMSx</h1>
        <nav>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className="nav-link">
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
