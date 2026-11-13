import type { JSX } from "react";

export type IconName =
  | "home" | "play" | "levels" | "ghost" | "pause" | "restart" | "lock" | "check"
  | "arrow-right" | "arrow-up" | "arrow-down" | "arrow-left" | "close" | "swipe" | "heart"
  | "sound" | "mute" | "help" | "chevron-left" | "chevron-right" | "vibrate" | "trophy" | "zoom";

interface IconProps {
  readonly name: IconName;
  readonly size?: number;
}

/** Hairline icon set: 1.8px strokes, round caps, inherits currentColor. */
export function Icon({ name, size = 22 }: IconProps): JSX.Element {
  return (
    <svg className="icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}

const PATHS: Record<IconName, JSX.Element> = {
  home: <path d="M4 11.5 12 4l8 7.5M6.5 10v9.5h11V10M10 19.5v-5h4v5" />,
  play: <path d="M8 5.5v13l11-6.5-11-6.5Z" className="icon-fill" />,
  levels: <path d="M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z" />,
  ghost: <path d="M5.5 19.5v-8a6.5 6.5 0 0 1 13 0v8l-2.2-1.8-2.1 1.8-2.2-1.8-2.2 1.8-2.1-1.8ZM9.5 11.5h.01M14.5 11.5h.01" />,
  pause: <path d="M8.5 5.5v13M15.5 5.5v13" />,
  restart: <path d="M19 12a7 7 0 1 1-2.1-5M19 4.5v4h-4" />,
  lock: <path d="M7 11h10v8.5H7zM9 11V8a3 3 0 0 1 6 0v3" />,
  check: <path d="m5.5 12.5 4.2 4.2 8.8-9" />,
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  "arrow-left": <path d="M19 12H5M11 6l-6 6 6 6" />,
  "arrow-up": <path d="M12 19V5M6 11l6-6 6 6" />,
  "arrow-down": <path d="M12 5v14M6 13l6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  swipe: <path d="M12 4v16M12 4 8.5 7.5M12 4l3.5 3.5M12 20l-3.5-3.5M12 20l3.5-3.5M4 12h16M4 12l3.5-3.5M4 12l3.5 3.5M20 12l-3.5-3.5M20 12l-3.5 3.5" />,
  heart: <path d="M12 19.5s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 7.8a3.9 3.9 0 0 1 7 2.1c0 5.2-7 9.6-7 9.6Z" className="icon-fill" />,
  sound: <path d="M4.5 9.5h3.2L12 6v12l-4.3-3.5H4.5zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />,
  mute: <path d="M4.5 9.5h3.2L12 6v12l-4.3-3.5H4.5zM16 9.5l4 5M20 9.5l-4 5" />,
  help: <path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2M12 17.6h.01M12 3.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4Z" />,
  "chevron-left": <path d="m14.5 6-6 6 6 6" />,
  "chevron-right": <path d="m9.5 6 6 6-6 6" />,
  vibrate: <path d="M8.5 4.5h7v15h-7zM4.5 8v8M19.5 8v8" />,
  zoom: <path d="M10.5 4.5a6 6 0 1 0 0 12 6 6 0 0 0 0-12ZM15 15l5 5M8 10.5h5M10.5 8v5" />,
  trophy: <path d="M8 4.5h8v5a4 4 0 0 1-8 0zM8 6.5H5v1.5a3 3 0 0 0 3 3M16 6.5h3v1.5a3 3 0 0 1-3 3M12 13.5v3.5M8.5 19.5h7" />
};
