export type CountdownConfig = {
  title: string;
  date: string;
  time: string;
  zone: string;
};

export type TimeZoneKey =
  | "Asia/Shanghai"
  | "America/Los_Angeles";

export const DEFAULT_CONFIG: CountdownConfig = {
  title: "期末考试",
  date: "2026-06-18",
  time: "09:30",
  zone: "Asia/Shanghai"
};

export const STORAGE_KEY = "time-anchor-countdown-next-v1";

export const ZONES = {
  beijing: "Asia/Shanghai",
  california: "America/Los_Angeles"
} as const;

export const ZONE_LABELS: Record<string, string> = {
  "Asia/Shanghai": "北京时间",
  "America/Los_Angeles": "加州时间"
};

export const TARGET_ZONE_OPTIONS: Array<{ value: TimeZoneKey; label: string }> = [
  { value: "Asia/Shanghai", label: "北京时间" },
  { value: "America/Los_Angeles", label: "加州时间" }
];

export function effectiveZone(zone: string) {
  return zone;
}

export function zoneLabel(zone: string) {
  return ZONE_LABELS[zone] || zone;
}

function parseDateTime(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  return { year, month, day, hour, minute };
}

function getWallParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });

  const parts: Record<string, number> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") {
      parts[part.type] = Number(part.value);
    }
  }
  return parts as {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getWallParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return asUtc - date.getTime();
}

export function zonedTimeToDate(dateValue: string, timeValue: string, timeZone: string) {
  const parts = parseDateTime(dateValue, timeValue);
  const utcGuess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    0
  );

  let date = new Date(utcGuess);
  for (let i = 0; i < 3; i += 1) {
    const offset = getTimeZoneOffsetMs(date, timeZone);
    const nextDate = new Date(utcGuess - offset);
    if (Math.abs(nextDate.getTime() - date.getTime()) < 1000) {
      date = nextDate;
      break;
    }
    date = nextDate;
  }
  return date;
}

export function getTargetDate(config: CountdownConfig) {
  return zonedTimeToDate(config.date, config.time, effectiveZone(config.zone));
}

export function formatTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).format(date);
}

export function formatDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).format(date);
}

export function formatTargetFull(date: Date, timeZone: string) {
  const dateText = new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(date);
  const timeText = new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(date);
  return `${dateText} ${timeText}`;
}

export function getRemainingParts(remainingMs: number) {
  const safeMs = Math.max(0, remainingMs);
  const totalSeconds = Math.floor(safeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}
