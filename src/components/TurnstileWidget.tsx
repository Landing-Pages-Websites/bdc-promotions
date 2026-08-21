"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ReactElement,
} from "react";

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      appearance?: "always" | "execute" | "interaction-only";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("turnstile")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("turnstile")), {
      once: true,
    });
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export interface TurnstileHandle {
  reset: () => void;
}

interface TurnstileWidgetProps {
  onToken: (token: string | null) => void;
}

const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onToken }, ref): ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;

    useImperativeHandle(ref, () => ({
      reset: () => {
        const id = widgetIdRef.current;
        if (id && window.turnstile) {
          window.turnstile.reset(id);
        }
      },
    }));

    useEffect(() => {
      const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
      const container = containerRef.current;
      if (!sitekey || !container) {
        onTokenRef.current(null);
        return;
      }

      let cancelled = false;
      void loadTurnstileScript()
        .then(() => {
          if (cancelled || !window.turnstile || !containerRef.current) return;
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey,
            appearance: "interaction-only",
            callback: (token) => onTokenRef.current(token),
            "expired-callback": () => onTokenRef.current(null),
            "error-callback": () => onTokenRef.current(null),
          });
        })
        .catch(() => {
          if (!cancelled) onTokenRef.current(null);
        });

      return () => {
        cancelled = true;
        const id = widgetIdRef.current;
        widgetIdRef.current = null;
        if (id && window.turnstile) {
          window.turnstile.remove(id);
        }
      };
    }, []);

    return <div ref={containerRef} className="mt-2" />;
  },
);

export default TurnstileWidget;
