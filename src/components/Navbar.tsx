import type { JSX } from "react";
import type { Route } from "../router";
import { playHref } from "../router";

/** Solid disc with a wedge cut out of the right side, matching the favicon. */
export function PacLogo(): JSX.Element {
  return (
    <svg viewBox="0 0 64 64" className="brand-mark" aria-hidden="true">
      <path d="M 52.48 46.34 A 25 25 0 1 1 52.48 17.66 L 32 32 Z" />
    </svg>
  );
}

interface NavbarProps {
  readonly route: Route;
  readonly continueLevel: number;
}

/** Desktop / tablet top bar. On phones it collapses to the brand only (the tab bar takes over). */
export function Navbar({ route, continueLevel }: NavbarProps): JSX.Element {
  const link = (href: string, label: string, on: boolean): JSX.Element => (
    <a href={href} className={on ? "nav-link on" : "nav-link"} aria-current={on ? "page" : undefined}>{label}</a>
  );
  return (
    <header className="navbar">
      <a className="brand" href="#/" aria-label="Aurum Maze home">
        <PacLogo />
        <span className="brand-text">
          <b>Aurum Maze</b>
          <small>Fifty luminous rounds</small>
        </span>
      </a>
      <nav className="nav-links" aria-label="Primary">
        {link("#/", "Home", route.name === "home" && route.section === "top")}
        {link("#/ghosts", "Ghost guide", route.name === "home" && route.section === "ghosts")}
        {link("#/levels", "Levels", route.name === "levels")}
        <a className="btn btn-primary btn-small" href={playHref(continueLevel)}>Play</a>
      </nav>
    </header>
  );
}
