const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDate(input: string) {
  const date = new Date(`${input}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date;
}

export function diffDaysInclusive(start: Date, end: Date) {
  const diff = Math.floor((end.getTime() - start.getTime()) / DAY_MS);
  return diff + 1;
}

export function calculateCheckInsRequired(
  startDate: string,
  endDate: string,
  frequency: "daily" | "weekly" | "one_time"
) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (end.getTime() < start.getTime()) {
    throw new Error("endDate must be on or after startDate");
  }

  if (frequency === "one_time") return 1;

  const days = diffDaysInclusive(start, end);
  if (frequency === "daily") return days;
  return Math.ceil(days / 7);
}
