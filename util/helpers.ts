import { Temporal } from "@js-temporal/polyfill";

export function timeSince(duration: Temporal.Duration): string {
  const units: Temporal.SmallestUnit<Temporal.DateTimeUnit>[] = [
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
  ];
  const today = Temporal.Now.plainDateTimeISO();

  for (const unit of units) {
    const total = duration
      .round({
        smallestUnit: unit,
        relativeTo: today,
      })
      .total({
        unit,
        relativeTo: today,
      });
    const rounded = Math.floor(total);

    if (rounded >= 1) {
      return `${rounded} ${unit}${rounded !== 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}
