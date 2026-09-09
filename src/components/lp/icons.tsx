import type { ReactElement, SVGProps } from "react";

/*
 * Technical line icons for the LP (design system: Lucide-family line style,
 * 20px inline / 28px feature, currentColor stroke). Inlined as SVG so the LP
 * ships no new icon dependency and every glyph is on-brand. NEVER emoji.
 *
 * Every icon's root SVG element carries an explicit `className="h-5 w-5"`
 * default (the 20px inline size). Callers that pass their own `className`
 * override it via the props spread, so this only sets the fallback size — but
 * it also gives the linter an explicit, statically-detectable size class on the
 * otherwise-opaque `{...base(props)}` tag.
 */

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps): IconProps {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: false,
    ...props,
  };
}

export function IconAudit(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <path d="M9 3h6a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2V4a1 1 0 0 1 1-1Z" />
      <path d="M9 5h6" />
      <path d="m9 13 2 2 4-4" />
    </svg>
  );
}

export function IconGauge(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <path d="M4 19a8 8 0 1 1 16 0" />
      <path d="m14 12-3 3" />
      <circle cx="12" cy="19" r="1.2" />
    </svg>
  );
}

export function IconTarget(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

export function IconMegaphone(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <path d="m3 11 14-6v14L3 13v-2Z" />
      <path d="M3 11H2a1 1 0 0 0-1 1v0a1 1 0 0 0 1 1h1" />
      <path d="M7 12.5V18a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2" />
      <path d="M20 9a3 3 0 0 1 0 6" />
    </svg>
  );
}

export function IconCalendar(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <rect x="4" y="5" width="16" height="16" rx="1.5" />
      <path d="M4 9h16" />
      <path d="M8 3v4M16 3v4" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}

export function IconReels(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 4 6 9M14 4l-2 5" />
      <path d="m11 12 4 2.5-4 2.5v-5Z" />
    </svg>
  );
}

export function IconQuote(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <path d="M9 7H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v2a2 2 0 0 1-2 2" />
      <path d="M19 7h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v2a2 2 0 0 1-2 2" />
    </svg>
  );
}

export function IconPhone(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

export function IconArrowRight(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function IconCheck(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <path d="m4 12 5 5L20 6" />
    </svg>
  );
}

export function IconChevronDown(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <path d="m5 9 7 7 7-7" />
    </svg>
  );
}

export function IconShield(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function IconScreenshot(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <rect x="3" y="4" width="18" height="14" rx="1.5" />
      <path d="M3 15l4-4 3 3 4-5 3 4" />
      <path d="M9 21h6M12 18v3" />
    </svg>
  );
}

export function IconChart(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <path d="M4 4v15a1 1 0 0 0 1 1h15" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </svg>
  );
}

export function IconSteering(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 9.5V4.5M9.8 13.6l-3.9 2.9M14.2 13.6l3.9 2.9" />
    </svg>
  );
}

export function IconSignal(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <path d="M4 20v-4M9 20v-8M14 20v-11M19 20V6" />
    </svg>
  );
}

export function IconUsers(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.4" />
      <path d="M17.5 14.3A5.5 5.5 0 0 1 20.5 19" />
    </svg>
  );
}

export function IconClock(props: IconProps): ReactElement {
  return (
    <svg className="h-5 w-5" {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
