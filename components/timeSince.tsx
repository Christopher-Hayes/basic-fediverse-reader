"use client";

import { useEffect, useState } from "react";
import { Temporal } from "@js-temporal/polyfill";
import { timeSince } from "@/util/helpers";

interface TimeSinceProps {
  publishedDate: string | null | undefined;
  className?: string;
  fallback?: string;
}

export default function TimeSince({
  publishedDate,
  className = "",
  fallback = "Some time ago",
}: TimeSinceProps) {
  const [timeString, setTimeString] = useState<string>(fallback);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated to avoid hydration mismatch
    setIsHydrated(true);

    const updateTime = () => {
      if (!publishedDate) {
        setTimeString(fallback);
        return;
      }

      try {
        const now = Temporal.Now.instant();
        const publishedTimestamp = new Date(publishedDate).getTime();
        const duration = now.since(
          Temporal.Instant.fromEpochMilliseconds(publishedTimestamp),
        );
        const newTimeString = timeSince(Temporal.Duration.from(duration));
        setTimeString(newTimeString);
      } catch (error) {
        console.warn("Error calculating time since:", error);
        setTimeString(fallback);
      }
    };

    // Update immediately
    updateTime();

    // Update every minute to keep time fresh
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [publishedDate, fallback]);

  // During SSR/initial render, show fallback to avoid hydration mismatch
  if (!isHydrated) {
    return <span className={className}>{fallback}</span>;
  }

  return <span className={className}>{timeString}</span>;
}
