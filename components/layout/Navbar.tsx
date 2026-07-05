"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navLinks = user?.role === "bank_officer"
    ? [
        { href: "/bank", label: "Portfolio" },
        { href: "/bank", label: "Fraud Alerts" },
      ]
    : user?.role === "admin"
    ? [
        { href: "/admin", label: "Users & Roles" },
      ]
    : [
        { href: "/dashboard", label: "My Health Card" },
        { href: "/onboarding", label: "Data Sources" },
      ];

  return (
    <nav
      style={{
        backgroundColor: "#1B3A2F",
        borderBottom: "1px solid rgba(201,166,107,0.2)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1.5rem",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.5rem",
        }}
      >
        {/* Wordmark */}
        <Link
          href={user?.role === "bank_officer" ? "/bank" : user?.role === "admin" ? "/admin" : "/dashboard"}
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "#F7F4ED",
            textDecoration: "none",
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          }}
        >
          FHC
          <span style={{ color: "#C9A66B", margin: "0 0.15em" }}>·</span>
          <span style={{ fontWeight: 400 }}>Financial Health Card</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {navLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              style={{
                color: "rgba(247,244,237,0.72)",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.78rem",
                fontWeight: 500,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                textDecoration: "none",
                padding: "0.375rem 0.75rem",
                borderRadius: "4px",
                transition: "color 200ms, background 200ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#C9A66B";
                e.currentTarget.style.backgroundColor = "rgba(201,166,107,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(247,244,237,0.72)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              {/* Role pill */}
              <span
                style={{
                  backgroundColor: "rgba(201,166,107,0.15)",
                  color: "#C9A66B",
                  border: "1px solid rgba(201,166,107,0.3)",
                  borderRadius: "3px",
                  padding: "0.125rem 0.5rem",
                  fontSize: "0.6rem",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {user.role === "bank_officer" ? "Bank Officer" : user.role === "admin" ? "Admin" : "MSME"}
              </span>
              {/* Name */}
              <span
                style={{
                  color: "rgba(247,244,237,0.82)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.8rem",
                  maxWidth: "140px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.name}
              </span>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "transparent",
              color: "rgba(247,244,237,0.55)",
              border: "1px solid rgba(247,244,237,0.15)",
              borderRadius: "4px",
              padding: "0.3rem 0.75rem",
              fontSize: "0.72rem",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "color 200ms, border-color 200ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(247,244,237,0.85)";
              e.currentTarget.style.borderColor = "rgba(247,244,237,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(247,244,237,0.55)";
              e.currentTarget.style.borderColor = "rgba(247,244,237,0.15)";
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
