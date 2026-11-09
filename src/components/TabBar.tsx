import type { JSX } from "react";
import type { Route } from "../router";
import { playHref } from "../router";
import { Icon } from "./Icons";

interface TabBarProps {
  readonly route: Route;
  readonly continueLevel: number;
}

/**
 * Mobile navigation: a four-item bottom tab bar inside the thumb zone.
 * Play is the emphasised centre-of-gravity action; the bar disappears during
 * a run so the maze gets the whole screen.
 */
export function TabBar({ route, continueLevel }: TabBarProps): JSX.Element {
  const items = [
    { href: "#/", label: "Home", icon: "home" as const, on: route.name === "home" && route.section === "top" },
    { href: playHref(continueLevel), label: "Play", icon: "play" as const, on: false, primary: true },
    { href: "#/levels", label: "Levels", icon: "levels" as const, on: route.name === "levels" },
    { href: "#/ghosts", label: "Ghosts", icon: "ghost" as const, on: route.name === "home" && route.section === "ghosts" }
  ];
  return (
    <nav className="tabbar" aria-label="Primary">
      {items.map(item => (
        <a
          key={item.label}
          href={item.href}
          className={`tab${item.on ? " tab-on" : ""}${item.primary ? " tab-primary" : ""}`}
          aria-current={item.on ? "page" : undefined}
        >
          <span className="tab-icon"><Icon name={item.icon} size={22} /></span>
          <span className="tab-label">{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
