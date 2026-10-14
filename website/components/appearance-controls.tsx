"use client";
import type { Theme } from "@/lib/appearance";
export function SidebarToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="jr-sidebar-toggle"
      aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
      title={collapsed ? "Open sidebar" : "Close sidebar"}
      aria-expanded={!collapsed}
      aria-controls="workspace-sidebar"
      onClick={onToggle}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="16" height="14" rx="3" />
        <path d="M7 3v14" />
        <path d={collapsed ? "m10 7 3 3-3 3" : "m13 7-3 3 3 3"} />
      </svg>
    </button>
  );
}
export function ThemeControl({
  value,
  onChange,
}: {
  value: Theme;
  onChange: (value: Theme) => void;
}) {
  return (
    <label className="jr-theme-control">
      <span className="sr-only">Appearance</span>
      <select
        aria-label="Appearance"
        value={value}
        onChange={(event) => onChange(event.target.value as Theme)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
