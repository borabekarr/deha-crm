import { env } from "./env";

let initialized = false;

function init(): void {
  if (initialized) return;

  const key = env.VITE_POSTHOG_KEY;
  const host = env.VITE_POSTHOG_HOST;

  if (!key) {
    console.warn("[analytics] VITE_POSTHOG_KEY missing — analytics disabled");
    initialized = true; // mark so we don't warn repeatedly
    return;
  }

  import("posthog-js").then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: host || "https://app.posthog.com",
      person_profiles: "identified_only",
    });
  });

  initialized = true;
}

function track(event: string, props?: Record<string, unknown>): void {
  if (!env.VITE_POSTHOG_KEY) return;
  import("posthog-js").then(({ default: posthog }) => {
    posthog.capture(event, props);
  });
}

function identify(userId: string, traits?: Record<string, unknown>): void {
  if (!env.VITE_POSTHOG_KEY) return;
  import("posthog-js").then(({ default: posthog }) => {
    posthog.identify(userId, traits);
  });
}

function reset(): void {
  if (!env.VITE_POSTHOG_KEY) return;
  import("posthog-js").then(({ default: posthog }) => {
    posthog.reset();
  });
}

export const analytics = { init, track, identify, reset };
