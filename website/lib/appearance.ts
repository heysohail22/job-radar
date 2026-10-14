"use client";
import { useEffect, useSyncExternalStore } from "react";

export type Theme = "system" | "light" | "dark";
const preferenceEvent = "jobradar-appearance";
function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function subscribe(listener: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === "jobradar-theme")
      delete document.documentElement.dataset.preference;
    if (!event.key || event.key === "jobradar-sidebar")
      delete document.documentElement.dataset.sidebar;
    listener();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(preferenceEvent, listener);
  media.addEventListener("change", listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(preferenceEvent, listener);
    media.removeEventListener("change", listener);
  };
}
function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
  // Keep controls functional even when browser storage is unavailable.
  document.documentElement.dataset[
    key === "jobradar-theme" ? "preference" : "sidebar"
  ] = value;
  window.dispatchEvent(new Event(preferenceEvent));
}
function getPreference(): Theme {
  const value =
    document.documentElement.dataset.preference ?? read("jobradar-theme");
  return value === "light" || value === "dark" ? value : "system";
}
export function useAppearance() {
  const preference = useSyncExternalStore(
    subscribe,
    getPreference,
    () => "system" as Theme,
  );
  const dark = useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
  const collapsed = useSyncExternalStore(
    subscribe,
    () =>
      (document.documentElement.dataset.sidebar ?? read("jobradar-sidebar")) ===
      "collapsed",
    () => false,
  );
  const theme =
    preference === "system" ? (dark ? "dark" : "light") : preference;
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return {
    preference,
    collapsed,
    setPreference: (value: Theme) => write("jobradar-theme", value),
    toggleSidebar: () =>
      write("jobradar-sidebar", collapsed ? "expanded" : "collapsed"),
  };
}
