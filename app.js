"use strict";

(() => {
  const storageKey = "ikebana-mode";
  const body = document.body;
  const button = document.getElementById("theme-toggle");
  const moon = button?.querySelector(".theme-icon-moon");
  const sun = button?.querySelector(".theme-icon-sun");
  const themeColor = document.getElementById("theme-color");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

  document.documentElement.classList.add("js-enabled");

  if (!button || !moon || !sun) return;

  const readSavedMode = () => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved === "dark" || saved === "light" ? saved : null;
    } catch {
      return null;
    }
  };

  const saveMode = (mode) => {
    try {
      window.localStorage.setItem(storageKey, mode);
    } catch {
      // The selected theme still works when storage is unavailable.
    }
  };

  const applyMode = (mode, persist = false) => {
    const dark = mode === "dark";
    body.classList.toggle("theme-dark", dark);
    body.classList.toggle("theme-light", !dark);
    moon.toggleAttribute("hidden", dark);
    sun.toggleAttribute("hidden", !dark);
    button.setAttribute("aria-label", dark ? "Ativar modo claro" : "Ativar modo escuro");
    themeColor?.setAttribute("content", dark ? "#111111" : "#FAFAF7");
    if (persist) saveMode(mode);
  };

  const savedMode = readSavedMode();
  applyMode(savedMode ?? (systemTheme.matches ? "dark" : "light"));

  button.addEventListener("click", () => {
    applyMode(body.classList.contains("theme-dark") ? "light" : "dark", true);
  });

  systemTheme.addEventListener?.("change", (event) => {
    if (readSavedMode() === null) applyMode(event.matches ? "dark" : "light");
  });
})();
