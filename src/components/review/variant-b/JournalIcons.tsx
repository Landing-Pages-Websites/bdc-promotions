import type { ReactElement } from "react";

type IconProps = { className?: string };

/* Line icons drawn to match image 2's stroke style. All decorative (aria-hidden). */

export function CheckCircleIcon({ className }: IconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 50 50" aria-hidden="true" focusable="false">
      <circle cx="25" cy="25" r="22.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M15.5 25.5 22 32 35 18.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckBadgeIcon({ className }: IconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 30 30" aria-hidden="true" focusable="false">
      <circle cx="15" cy="15" r="15" fill="currentColor" />
      <path d="M8.6 15.4 12.9 19.6 21.6 10.6" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowIcon({ className }: IconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 28 24" aria-hidden="true" focusable="false">
      <path d="M1.5 12h24M15 2l10.5 10L15 22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M6.6 1.6c.6-.4 1.4-.3 1.9.3l2.6 3.4c.4.6.4 1.4-.1 1.9L9.4 8.8c-.3.3-.4.8-.2 1.2 1 2 2.6 3.7 4.6 4.8.4.2.9.2 1.2-.1l1.6-1.6c.5-.5 1.3-.6 1.9-.1l3.4 2.6c.6.5.7 1.3.3 1.9l-1.4 2.2c-.7 1.1-2.1 1.7-3.4 1.4C9.9 19.6 4.4 14.1 2.9 6.6c-.3-1.3.3-2.7 1.4-3.4z"
      />
    </svg>
  );
}

export function MailIcon({ className }: IconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 32 24" aria-hidden="true" focusable="false">
      <rect x="1.2" y="1.2" width="29.6" height="21.6" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M1.8 2 16 13.6 30.2 2M1.8 22 12.2 11M30.2 22 19.8 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function CameraIcon({ className }: IconProps): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 20" aria-hidden="true" focusable="false">
      <path
        d="M2.5 5.2h4.6L9 2.4h6l1.9 2.8h4.6c.6 0 1 .4 1 1v11.4c0 .6-.4 1-1 1h-19c-.6 0-1-.4-1-1V6.2c0-.6.4-1 1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11.4" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18.6" cy="8" r=".9" fill="currentColor" />
    </svg>
  );
}

export function ClipboardSearchIcon({ className }: IconProps): ReactElement {
  return (
    <svg className={className} viewBox="10 3 88 84" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M58 57V16.5c0-1.7-1.3-3-3-3H46" />
        <path d="M24 13.5h-9c-1.7 0-3 1.3-3 3v68c0 1.7 1.3 3 3 3h40" />
        <path d="M25 8.5h6.5a4.5 4.5 0 0 1 9 0H47v10H25z" />
        <path d="M20 32l3.2 3.2 6-6.4M20 49l3.2 3.2 6-6.4M20 66l3.2 3.2 6-6.4" />
        <path d="M35 33.5h13M35 50.5h9M35 67.5h9" />
        <circle cx="69" cy="58" r="16" />
        <path d="M61.8 58.4l4.8 4.8 9.6-10.4" />
        <path d="M80.5 69.5 94 83" strokeWidth="5.2" />
      </g>
    </svg>
  );
}
