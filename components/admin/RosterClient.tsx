"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RosterRow } from "@/lib/data/admin";
import { LevelBadge } from "@/components/primitives/LevelBadge";
import { LoadOnTimeCompact } from "@/components/primitives/LoadOnTime";
import { SearchIcon } from "@/components/primitives/icons";

type SortKey = "load" | "onTime";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function RosterClient({ roster }: { roster: RosterRow[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("load");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = term ? roster.filter((r) => r.name.toLowerCase().includes(term)) : roster;
    return [...rows].sort((a, b) => (sortKey === "load" ? b.load - a.load : b.onTimePct - a.onTimePct));
  }, [roster, search, sortKey]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="zx-lbl" style={{ marginBottom: 6 }}>
            Admin
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-strong)", margin: 0 }}>Freelancer roster</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: 13 }}>
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name…"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                height: 36,
                padding: "0 14px 0 36px",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-pill)",
                background: "var(--surface-card)",
                color: "var(--text-body)",
                width: 180,
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Sort</span>
          <div style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: "var(--radius-pill)", background: "var(--neutral-100)" }}>
            <SegButton active={sortKey === "load"} onClick={() => setSortKey("load")} label="Load" />
            <SegButton active={sortKey === "onTime"} onClick={() => setSortKey("onTime")} label="On-time" />
          </div>
        </div>
      </div>

      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1.8fr 1.2fr",
            gap: 12,
            padding: "13px 22px",
            background: "var(--surface-sunken)",
            borderBottom: "1px solid var(--divider)",
          }}
        >
          <span className="zx-lbl">Freelancer</span>
          <span className="zx-lbl">Level</span>
          <span className="zx-lbl">Load &amp; on-time</span>
          <span className="zx-lbl">Completed</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "64px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-strong)" }}>
              {search ? `No freelancers named "${search}"` : "No freelancers yet"}
            </div>
          </div>
        ) : (
          filtered.map((f) => (
            <Link
              key={f.userId}
              href={`/admin/freelancers/${f.userId}`}
              className="zx-row"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1.8fr 1.2fr",
                gap: 12,
                alignItems: "center",
                padding: "14px 22px",
                borderBottom: "1px solid var(--divider)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    background: f.level === "Senior" ? "var(--color-deep-navy)" : "var(--neutral-100)",
                    color: f.level === "Senior" ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {initials(f.name)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.skillsSummary || f.headline}</div>
                </div>
              </div>
              <div>
                <LevelBadge level={f.level} size="sm" />
              </div>
              <div>
                <LoadOnTimeCompact load={f.load} onTimePct={f.onTimePct} />
              </div>
              <div style={{ fontSize: 13, color: "var(--text-body)" }}>
                <span style={{ fontWeight: 700 }}>{f.completedCount}</span>{" "}
                <span style={{ color: "var(--text-muted)" }}>projects</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function SegButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: 12.5,
        fontWeight: 600,
        height: 28,
        padding: "0 14px",
        borderRadius: "var(--radius-pill)",
        border: "none",
        cursor: "pointer",
        background: active ? "var(--surface-card)" : "transparent",
        color: active ? "var(--color-primary-blue)" : "var(--text-muted)",
        boxShadow: active ? "var(--shadow-xs)" : "none",
      }}
    >
      {label}
    </button>
  );
}
