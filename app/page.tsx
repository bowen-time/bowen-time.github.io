"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  Clipboard,
  Clock3,
  RotateCcw,
  Settings,
  TimerReset,
  X
} from "lucide-react";
import { TimeRibbon } from "@/components/TimeRibbon";
import {
  CountdownConfig,
  DEFAULT_CONFIG,
  HIDDEN_UNITS_STORAGE_KEY,
  STORAGE_KEY,
  TARGET_ZONE_OPTIONS,
  TIME_UNIT_KEYS,
  TimeUnitKey,
  ZONES,
  effectiveZone,
  formatMaskedClockTime,
  formatMaskedDate,
  formatMaskedTargetFull,
  formatTargetFull,
  getRemainingParts,
  getTargetDate,
  pad2,
  zoneLabel
} from "@/lib/time";

type ClockCardProps = {
  tone: "beijing" | "california";
  label: string;
  zone: string;
  now: Date | null;
  targetDate: Date;
  hiddenUnits: ReadonlySet<TimeUnitKey>;
};

function ClockCard({ tone, label, zone, now, targetDate, hiddenUnits }: ClockCardProps) {
  return (
    <article className={`clock-card ${tone}`}>
      <div className="clock-card__head">
        <span className="clock-card__icon">
          <Clock3 size={18} strokeWidth={2.2} />
        </span>
        <div>
          <p className="micro-label">{label}</p>
          <p className="clock-time">{now ? formatMaskedClockTime(now, zone, hiddenUnits) : "--:--:--"}</p>
        </div>
      </div>
      <div className={`clock-date-row${hiddenUnits.has("days") ? " is-hidden" : ""}`}>
        <span>{now ? formatMaskedDate(now, zone, hiddenUnits) : "--"}</span>
      </div>
      <p className="target-line">考试时：{formatMaskedTargetFull(targetDate, zone, hiddenUnits)}</p>
    </article>
  );
}

function readSavedConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved?.title && saved?.date && saved?.time && saved?.zone) {
      const zoneIsSupported = TARGET_ZONE_OPTIONS.some((option) => option.value === saved.zone);
      return {
        ...DEFAULT_CONFIG,
        ...saved,
        zone: zoneIsSupported ? saved.zone : DEFAULT_CONFIG.zone
      } as CountdownConfig;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return DEFAULT_CONFIG;
}

function isTimeUnitKey(value: unknown): value is TimeUnitKey {
  return typeof value === "string" && TIME_UNIT_KEYS.includes(value as TimeUnitKey);
}

function readSavedHiddenUnits() {
  try {
    const saved = JSON.parse(localStorage.getItem(HIDDEN_UNITS_STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) {
      return saved.filter(isTimeUnitKey);
    }
  } catch {
    localStorage.removeItem(HIDDEN_UNITS_STORAGE_KEY);
  }
  return [];
}

function maskDateInput(dateValue: string, hiddenUnits: ReadonlySet<TimeUnitKey>) {
  return hiddenUnits.has("days") ? "••••-••-••" : dateValue;
}

function maskTimeInput(timeValue: string, hiddenUnits: ReadonlySet<TimeUnitKey>) {
  const [hour = "--", minute = "--"] = timeValue.split(":");
  return `${hiddenUnits.has("hours") ? "••" : hour}:${hiddenUnits.has("minutes") ? "••" : minute}`;
}

function maskCountdownValue(
  value: number,
  unit: TimeUnitKey,
  hiddenUnits: ReadonlySet<TimeUnitKey>,
  padded = false
) {
  if (hiddenUnits.has(unit)) {
    return unit === "days" ? "••" : "••";
  }
  return padded ? pad2(value) : String(value);
}

export default function Home() {
  const [now, setNow] = useState<Date | null>(null);
  const [config, setConfig] = useState<CountdownConfig>(DEFAULT_CONFIG);
  const [draft, setDraft] = useState<CountdownConfig>(DEFAULT_CONFIG);
  const [hiddenUnits, setHiddenUnits] = useState<TimeUnitKey[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setConfig(readSavedConfig());
    setHiddenUnits(readSavedHiddenUnits());
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const targetDate = useMemo(() => getTargetDate(config), [config]);
  const targetZone = effectiveZone(config.zone);
  const hiddenUnitSet = useMemo(() => new Set(hiddenUnits), [hiddenUnits]);
  const remainingMs = now ? targetDate.getTime() - now.getTime() : 0;
  const parts = getRemainingParts(remainingMs);
  const totalHours = remainingMs > 0 ? (remainingMs / 3600000).toFixed(1) : "0.0";
  const status =
    remainingMs <= 0
      ? "目标已到"
      : remainingMs < 3600000
        ? "最后一小时"
        : remainingMs < 86400000
          ? "24 小时内"
          : "倒计时中";

  const actualTargetBeijing = formatTargetFull(targetDate, ZONES.beijing);
  const actualTargetCalifornia = formatTargetFull(targetDate, ZONES.california);
  const targetBeijing = formatMaskedTargetFull(targetDate, ZONES.beijing, hiddenUnitSet);
  const targetCalifornia = formatMaskedTargetFull(targetDate, ZONES.california, hiddenUnitSet);
  const summary = `还剩 ${maskCountdownValue(parts.days, "days", hiddenUnitSet)} 天 ${maskCountdownValue(
    parts.hours,
    "hours",
    hiddenUnitSet
  )} 小时 ${maskCountdownValue(parts.minutes, "minutes", hiddenUnitSet)} 分钟`;
  const totalHoursHidden = hiddenUnitSet.has("days") || hiddenUnitSet.has("hours");
  const visibleTotalHours = totalHoursHidden ? "•••" : totalHours;
  const displayUnits: Array<{ key: TimeUnitKey; label: string; value: string }> = [
    { key: "days", label: "天", value: now ? maskCountdownValue(parts.days, "days", hiddenUnitSet) : "--" },
    { key: "hours", label: "小时", value: now ? maskCountdownValue(parts.hours, "hours", hiddenUnitSet, true) : "--" },
    { key: "minutes", label: "分钟", value: now ? maskCountdownValue(parts.minutes, "minutes", hiddenUnitSet, true) : "--" },
    { key: "seconds", label: "秒", value: now ? maskCountdownValue(parts.seconds, "seconds", hiddenUnitSet, true) : "--" }
  ];

  const openSettings = () => {
    setDraft(config);
    setSettingsOpen(true);
  };

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = {
      ...draft,
      title: draft.title.trim() || DEFAULT_CONFIG.title
    };
    setConfig(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSettingsOpen(false);
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    setDraft(DEFAULT_CONFIG);
    setHiddenUnits([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HIDDEN_UNITS_STORAGE_KEY);
    setSettingsOpen(false);
  };

  const toggleHiddenUnit = (unit: TimeUnitKey) => {
    setHiddenUnits((current) => {
      const next = current.includes(unit)
        ? current.filter((item) => item !== unit)
        : [...current, unit];
      localStorage.setItem(HIDDEN_UNITS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const copySummary = async () => {
    const text = `${config.title}：${zoneLabel(config.zone)} ${formatTargetFull(
      targetDate,
      targetZone
    )}；北京时间 ${actualTargetBeijing}；加州时间 ${actualTargetCalifornia}。`;
    await navigator.clipboard?.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <TimerReset size={24} strokeWidth={2.3} />
          </div>
          <div>
            <p className="micro-label">Time Anchor</p>
            <h1>{config.title}倒计时</h1>
          </div>
        </div>

        <div className="top-actions">
          <button className="icon-button" type="button" onClick={copySummary} title="复制时间摘要" aria-label="复制时间摘要">
            {copied ? <Check size={20} strokeWidth={2.4} /> : <Clipboard size={20} strokeWidth={2.2} />}
          </button>
          <button className="icon-button" type="button" onClick={openSettings} title="设置目标" aria-label="设置目标">
            <Settings size={20} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      <section className="hero-grid">
        <div className="countdown-panel">
          <div className="target-row">
            <div>
              <p className="status-pill">
                <span aria-hidden="true" />
                {status}
              </p>
              <h2>{config.title}</h2>
              <p className="target-copy">
                {zoneLabel(config.zone)} {formatMaskedTargetFull(targetDate, targetZone, hiddenUnitSet)}
              </p>
            </div>
            <div className="target-chip">
              <CalendarClock size={18} strokeWidth={2.2} />
              <span>{maskDateInput(config.date, hiddenUnitSet)}</span>
              <b>{maskTimeInput(config.time, hiddenUnitSet)}</b>
            </div>
          </div>

          <div className="countdown-grid" aria-live="polite">
            {displayUnits.map((unit) => {
              const isHidden = hiddenUnitSet.has(unit.key);
              return (
                <button
                  key={unit.key}
                  className={`count-unit${isHidden ? " is-hidden" : ""}`}
                  type="button"
                  aria-pressed={isHidden}
                  aria-label={`${isHidden ? "显示" : "隐藏"}${unit.label}`}
                  title={`${isHidden ? "显示" : "隐藏"}${unit.label}`}
                  onClick={() => toggleHiddenUnit(unit.key)}
                >
                  <span className="count-unit__inner">
                    <span className="count-unit__face count-unit__front">
                      <strong>{unit.value}</strong>
                      <span>{unit.label}</span>
                    </span>
                    <span className="count-unit__face count-unit__back" aria-hidden="true">
                      <span className="count-unit__mask">••</span>
                      <span>{unit.label}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mobile-clock-panel" aria-label="手机双时钟">
            <ClockCard
              tone="beijing"
              label="北京时间"
              zone={ZONES.beijing}
              now={now}
              targetDate={targetDate}
              hiddenUnits={hiddenUnitSet}
            />
            <ClockCard
              tone="california"
              label="加州时间"
              zone={ZONES.california}
              now={now}
              targetDate={targetDate}
              hiddenUnits={hiddenUnitSet}
            />
          </div>

          <div className="summary-strip">
            <div className="summary-copy">
              <p>{now ? summary : "正在同步设备时间"}</p>
              <span>加州：{targetCalifornia}</span>
            </div>
            <div className="hours-box">
              <span>{visibleTotalHours}</span>
              <b>小时</b>
            </div>
          </div>
        </div>

        <aside className="side-panel">
          <div className="visual-panel">
            <TimeRibbon now={now} hiddenUnits={hiddenUnitSet} />
          </div>
          <div className="clock-stack">
            <ClockCard
              tone="beijing"
              label="北京时间"
              zone={ZONES.beijing}
              now={now}
              targetDate={targetDate}
              hiddenUnits={hiddenUnitSet}
            />
            <ClockCard
              tone="california"
              label="加州时间"
              zone={ZONES.california}
              now={now}
              targetDate={targetDate}
              hiddenUnits={hiddenUnitSet}
            />
          </div>
        </aside>
      </section>

      {settingsOpen && (
        <div className="modal-backdrop" role="presentation">
          <form className="settings-modal" onSubmit={saveSettings}>
            <div className="modal-head">
              <div>
                <p className="micro-label">Target</p>
                <h2>目标设置</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setSettingsOpen(false)} title="关闭" aria-label="关闭">
                <X size={20} strokeWidth={2.2} />
              </button>
            </div>

            <label className="field full">
              <span>标题</span>
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                maxLength={36}
                required
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span>日期</span>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span>时间</span>
                <input
                  type="time"
                  value={draft.time}
                  onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))}
                  required
                />
              </label>
            </div>

            <label className="field full">
              <span>目标时区</span>
              <select
                value={draft.zone}
                onChange={(event) => setDraft((current) => ({ ...current, zone: event.target.value }))}
              >
                {TARGET_ZONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="modal-actions">
              <button className="text-button" type="button" onClick={resetConfig}>
                <RotateCcw size={17} strokeWidth={2.2} />
                恢复默认
              </button>
              <button className="primary-button" type="submit">
                <Check size={17} strokeWidth={2.2} />
                保存到本机
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
