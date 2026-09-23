import type { ReactElement } from "react";

type IconProps = { className?: string };

const line = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function TargetIcon({ className }: IconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 52 52" aria-hidden="true" focusable="false">
      <g {...line} strokeWidth="3.2">
        <circle cx="26" cy="26" r="15" />
        <path d="M26 3v12M26 37v12M3 26h12M37 26h12" />
      </g>
      <circle cx="26" cy="26" r="4.6" fill="currentColor" />
    </svg>
  );
}

export function ArrowIcon({ className }: IconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path {...line} strokeWidth="2.6" d="M4 12h15M13 5.5 19.5 12 13 18.5" />
    </svg>
  );
}

export function LongArrowIcon({ className }: IconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 40 24" aria-hidden="true" focusable="false">
      <path {...line} strokeWidth="2.4" d="M2 12h34M26 3l10 9-10 9" />
    </svg>
  );
}

export function PhoneOutlineIcon({ className }: IconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        {...line}
        strokeWidth="1.8"
        d="M7.2 3.5 9.6 6c.5.5.6 1.3.2 1.9L8.5 9.8c1.2 2.6 3.1 4.5 5.7 5.7l1.9-1.3c.6-.4 1.4-.3 1.9.2l2.5 2.4c.6.6.6 1.5 0 2.1l-1.6 1.6c-.9.9-2.2 1.2-3.4.8C9.4 19.2 4.8 14.6 2.9 8.5c-.4-1.2-.1-2.5.8-3.4l1.6-1.6c.5-.6 1.4-.6 1.9 0Z"
      />
    </svg>
  );
}

export function PhoneSolidIcon({ className }: IconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M6.6 2.2c.5-.4 1.3-.3 1.7.2l2.9 3.6c.4.5.4 1.2 0 1.7L9.6 9.9c1.1 2 2.7 3.7 4.6 4.8l2.2-1.6c.5-.4 1.2-.4 1.7 0l3.6 2.9c.5.4.6 1.2.2 1.7l-1.8 2.3c-.8 1-2.1 1.4-3.3 1C9.9 19 5 14.1 3.1 7.2c-.3-1.2 0-2.5 1-3.3Z"
      />
    </svg>
  );
}

export function MailIcon({ className }: IconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 34 24" aria-hidden="true" focusable="false">
      <g {...line} strokeWidth="1.7">
        <rect x="1.5" y="1.5" width="31" height="21" rx="1" />
        <path d="m2 2 15 11L32 2M2 22l11-9M32 22l-11-9" />
      </g>
    </svg>
  );
}

export function ShieldCheckIcon({ className }: IconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 48 62" aria-hidden="true" focusable="false">
      <g {...line} strokeWidth="2">
        <path d="M24 2 45 10v19c0 15-9 25-21 31C12 54 3 44 3 29V10Z" />
        <path d="m15 31 6 6 12-12" />
      </g>
    </svg>
  );
}

export function DocumentCheckIcon({ className }: IconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 50 62" aria-hidden="true" focusable="false">
      <g {...line} strokeWidth="2">
        <path d="M30 48H3V2h24l9 9v25" />
        <path d="M27 2v9h9M10 17h18M10 25h18M10 33h12" />
        <circle cx="38" cy="49" r="10" />
        <path d="m33.5 49 3.2 3.2 6-6" />
      </g>
    </svg>
  );
}

export function ProhibitionIcon({ className }: IconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 58 58" aria-hidden="true" focusable="false">
      <g {...line} strokeWidth="2">
        <circle cx="29" cy="29" r="27" />
        <path d="M10 10 48 48" />
      </g>
    </svg>
  );
}
