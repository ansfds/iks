import { useEffect, useRef } from "react";

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
export function AdminChallenge({
  siteKey,
  onToken,
  attempt,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  attempt: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let widget: string | undefined,
      canceled = false;
    const api = () =>
      (window as unknown as { turnstile?: Turnstile }).turnstile;
    const render = () => {
      if (!canceled && container.current && api())
        widget = api()!.render(container.current, {
          sitekey: siteKey,
          action: "admin-login",
          callback: onToken,
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });
    };
    let script = document.querySelector<HTMLScriptElement>(
      "script[data-admin-turnstile]"
    );
    if (!script) {
      script = document.createElement("script");
      script.dataset.adminTurnstile = "1";
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      document.head.appendChild(script);
    }
    if (api()) render();
    else script.addEventListener("load", render);
    return () => {
      canceled = true;
      script?.removeEventListener("load", render);
      if (widget && api()) api()!.remove(widget);
    };
  }, [siteKey, onToken, attempt]);
  return <div ref={container} aria-label="التحقق الأمني" />;
}
