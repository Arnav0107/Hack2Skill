"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import StatusPill from "@/components/ui/StatusPill";
import { staggerDelay } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: "msme" | "bank_officer" | "admin";
  status: "active" | "suspended";
  createdAt: string;
}

const MOCK_USERS: User[] = [
  { id: "u-001", name: "Arjuna Textile Mills", email: "owner@arjunatextile.in", role: "msme", status: "active", createdAt: "2025-06-01" },
  { id: "u-002", name: "Priya Venkataraman", email: "p.venkataraman@sbi.co.in", role: "bank_officer", status: "active", createdAt: "2025-05-15" },
  { id: "u-003", name: "Siddharth Tech Solutions", email: "admin@siddharthtech.io", role: "msme", status: "active", createdAt: "2025-06-10" },
  { id: "u-004", name: "Rajputana Steel Works", email: "rswproprietor@gmail.com", role: "msme", status: "suspended", createdAt: "2025-06-05" },
  { id: "u-005", name: "Ananya Krishnan", email: "a.krishnan@hdfc.co.in", role: "bank_officer", status: "active", createdAt: "2025-05-20" },
  { id: "u-006", name: "System Admin", email: "admin@fhc.in", role: "admin", status: "active", createdAt: "2025-01-01" },
];

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<User["role"]>("msme");

  const handleRoleChange = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: newRole } : u));
    setEditingId(null);
  };

  const handleToggleStatus = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u));
  };

  const handleRemove = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const rolePillVariant = (role: User["role"]) =>
    role === "admin" ? "forest" : role === "bank_officer" ? "gold" : "neutral";

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "2.5rem 1.5rem" }} className="page-enter">
        <div style={{ marginBottom: "2rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.375rem" }}>Admin Panel</p>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.75rem", fontWeight: 600, color: "#3A342C", margin: "0 0 0.25rem" }}>
            Users & Roles
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#9B9188", margin: 0 }}>
            Manage platform access and user role assignments.
          </p>
        </div>

        {/* Summary */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {[
            { label: "Total Users", value: users.length },
            { label: "MSME", value: users.filter((u) => u.role === "msme").length },
            { label: "Bank Officers", value: users.filter((u) => u.role === "bank_officer").length },
            { label: "Admins", value: users.filter((u) => u.role === "admin").length },
            { label: "Suspended", value: users.filter((u) => u.status === "suspended").length },
          ].map((s, i) => (
            <div key={s.label} className="card-static stagger-item" style={{ padding: "0.75rem 1.125rem", ...staggerDelay(i, 60) }}>
              <p className="eyebrow" style={{ marginBottom: "0.15rem", fontSize: "0.58rem" }}>{s.label}</p>
              <span style={{ fontFamily: "Playfair Display, serif", fontSize: "1.5rem", fontWeight: 700, color: "#1B3A2F" }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto", borderRadius: "5px", border: "1px solid rgba(201,166,107,0.2)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#1B3A2F" }}>
                {["Name", "Email", "Role", "Status", "Created", "Actions"].map((col) => (
                  <th key={col} style={{ padding: "0.625rem 0.875rem", textAlign: "left", fontFamily: "Inter", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(247,244,237,0.72)", whiteSpace: "nowrap" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  className="stagger-item"
                  style={{
                    ...staggerDelay(i, 60),
                    backgroundColor: user.status === "suspended" ? "rgba(139,58,58,0.03)" : "#FAF8F3",
                    borderBottom: "1px solid rgba(201,166,107,0.15)",
                  }}
                >
                  <td style={{ padding: "0.75rem 0.875rem", fontFamily: "Playfair Display, serif", fontSize: "0.88rem", fontWeight: 600, color: "#3A342C" }}>
                    {user.name}
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem", fontFamily: "Inter", fontSize: "0.78rem", color: "#6B6259" }}>
                    {user.email}
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    {editingId === user.id ? (
                      <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value as User["role"])}
                          className="select-field"
                          style={{ fontSize: "0.72rem", padding: "0.3rem 0.5rem", maxWidth: "120px" }}
                        >
                          <option value="msme">MSME</option>
                          <option value="bank_officer">Bank Officer</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button onClick={() => handleRoleChange(user.id)} style={{ fontSize: "0.65rem", fontFamily: "Inter", fontWeight: 600, color: "#1B3A2F", backgroundColor: "#E5EDE9", border: "1px solid rgba(27,58,47,0.2)", borderRadius: "3px", padding: "0.25rem 0.5rem", cursor: "pointer" }}>Save</button>
                        <button onClick={() => setEditingId(null)} style={{ fontSize: "0.65rem", fontFamily: "Inter", color: "#9B9188", backgroundColor: "transparent", border: "none", cursor: "pointer" }}>✕</button>
                      </div>
                    ) : (
                      <StatusPill label={user.role.replace("_", " ")} variant={rolePillVariant(user.role)} />
                    )}
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <StatusPill
                      label={user.status}
                      variant={user.status === "active" ? "forest" : "fraud"}
                    />
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem", fontFamily: "Inter", fontSize: "0.75rem", color: "#9B9188" }}>
                    {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "0.75rem 0.875rem" }}>
                    <div style={{ display: "flex", gap: "0.375rem", flexWrap: "nowrap" }}>
                      <button
                        onClick={() => { setEditingId(user.id); setNewRole(user.role); }}
                        style={{ fontSize: "0.65rem", fontFamily: "Inter", fontWeight: 600, color: "#8B6914", backgroundColor: "transparent", border: "1px solid rgba(201,166,107,0.35)", borderRadius: "3px", padding: "0.25rem 0.55rem", cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        Edit Role
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        style={{ fontSize: "0.65rem", fontFamily: "Inter", fontWeight: 600, color: user.status === "active" ? "#8B3A3A" : "#3E6B45", backgroundColor: "transparent", border: `1px solid ${user.status === "active" ? "rgba(139,58,58,0.3)" : "rgba(62,107,69,0.3)"}`, borderRadius: "3px", padding: "0.25rem 0.55rem", cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        {user.status === "active" ? "Suspend" : "Restore"}
                      </button>
                      {user.role !== "admin" && (
                        <button
                          onClick={() => handleRemove(user.id)}
                          style={{ fontSize: "0.65rem", fontFamily: "Inter", fontWeight: 600, color: "#8B3A3A", backgroundColor: "transparent", border: "1px solid rgba(139,58,58,0.3)", borderRadius: "3px", padding: "0.25rem 0.55rem", cursor: "pointer" }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
