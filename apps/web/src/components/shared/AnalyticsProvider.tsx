import { analytics } from "@/lib/analytics";

// Module-level init — runs once when this module is first imported.
// No useEffect needed or allowed.
analytics.init();

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  return <>{children}</>;
}
