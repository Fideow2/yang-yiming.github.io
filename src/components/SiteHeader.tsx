import { useCallback, useEffect, useState } from "react";
import { sections, siteMeta } from "../content";
import type { SectionId } from "../types";

type ThemeMode = "auto" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

interface SiteHeaderProps {
  activeSection?: SectionId;
  isHome?: boolean;
}

const expandedScrollThreshold = 56;

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode !== "auto") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function SiteHeader({ activeSection, isHome = false }: SiteHeaderProps) {
  const [isCompact, setIsCompact] = useState(() => {
    if (!isHome) {
      return true;
    }

    return window.scrollY > expandedScrollThreshold;
  });
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "auto";
    }

    const storedMode = window.localStorage.getItem("theme-mode") as ThemeMode | null;
    return storedMode ?? "auto";
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(themeMode),
  );

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => {
      if (prev === "auto") {
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        return systemDark ? "light" : "dark";
      }
      return prev === "light" ? "dark" : "light";
    });
  }, []);

  useEffect(() => {
    if (!isHome) {
      setIsCompact(true);
      return;
    }

    const updateHeaderState = () => {
      setIsCompact(window.scrollY > expandedScrollThreshold);
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateHeaderState);
    };
  }, [isHome]);

  useEffect(() => {
    const navHeight = isHome && !isCompact
      ? "var(--nav-height-home-expanded)"
      : "var(--nav-height-compact)";

    document.documentElement.style.setProperty("--nav-height", navHeight);

    return () => {
      document.documentElement.style.setProperty(
        "--nav-height",
        "var(--nav-height-compact)",
      );
    };
  }, [isCompact, isHome]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    if (themeMode === "auto") {
      document.documentElement.removeAttribute("data-theme");
      return;
    }

    document.documentElement.setAttribute("data-theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("theme-mode", themeMode);
  }, [themeMode]);

  useEffect(() => {
    setResolvedTheme(resolveTheme(themeMode));

    if (themeMode !== "auto") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolvedTheme(resolveTheme("auto"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [themeMode]);

  const headerClassName = [
    "site-header",
    isHome ? "site-header--home" : "",
    isCompact ? "site-header--compact" : "site-header--expanded",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClassName}>
      <div className="site-header__inner">
        <a className="site-mark" href="/">
          <span className="site-mark__name">{siteMeta.name}</span>
          <span className="site-mark__role">{siteMeta.role}</span>
        </a>
        <div className="site-header__controls">
          <nav aria-label="Section navigation" className="site-nav">
            {sections.map((section) => {
              const isActive = section.id === activeSection;

              return (
                <a
                  key={section.id}
                  className={`site-nav__link${isActive ? " is-active" : ""}`}
                  href={section.id === "home" ? "/" : `/#${section.id}`}
                >
                  {section.navLabel}
                </a>
              );
            })}
          </nav>

          <div className="theme-toggle">
            <button
              type="button"
              className="theme-toggle__button"
              onClick={toggleTheme}
              data-resolved-theme={resolvedTheme}
              aria-label={`Switch theme${themeMode !== "auto" ? ` (currently ${themeMode})` : ""}`}
            >
              <svg
                className="theme-toggle__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <g className="theme-toggle__sun">
                  <circle cx="12" cy="12" r="5" fill="currentColor" stroke="none" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </g>
                <g className="theme-toggle__moon">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" stroke="none" />
                </g>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
