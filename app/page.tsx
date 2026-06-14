"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  Clipboard,
  Clock3,
  Compass,
  Plane,
  RotateCcw,
  Settings,
  TimerReset,
  X
} from "lucide-react";
import { TimeRibbon } from "@/components/TimeRibbon";
import {
  CountdownConfig,
  DEFAULT_CONFIG,
  STORAGE_KEY,
  TARGET_ZONE_OPTIONS,
  ZONES,
  effectiveZone,
  formatDate,
  formatTargetFull,
  formatTime,
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
};

function ClockCard({ tone, label, zone, now, targetDate }: ClockCardProps) {
  return (
    <article className={`clock-card ${tone}`}>
      <div className="clock-card__head">
        <span className="clock-card__icon">
          <Clock3 size={18} strokeWidth={2.2} />
        </span>
        <div>
          <p className="micro-label">{label}</p>
          <p className="clock-time">{now ? formatTime(now, zone) : "--:--:--"}</p>
        </div>
      </div>
      <div className="clock-date-row">
        <span>{now ? formatDate(now, zone) : "--"}</span>
      </div>
      <p className="target-line">考试时：{formatTargetFull(targetDate, zone)}</p>
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

export default function Home() {
  const [now, setNow] = useState<Date | null>(null);
  const [config, setConfig] = useState<CountdownConfig>(DEFAULT_CONFIG);
  const [draft, setDraft] = useState<CountdownConfig>(DEFAULT_CONFIG);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setConfig(readSavedConfig());
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const targetDate = useMemo(() => getTargetDate(config), [config]);
  const targetZone = effectiveZone(config.zone);
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

  const targetBeijing = formatTargetFull(targetDate, ZONES.beijing);
  const targetCalifornia = formatTargetFull(targetDate, ZONES.california);
  const summary = `还剩 ${parts.days} 天 ${parts.hours} 小时 ${parts.minutes} 分钟。加州日历：${targetCalifornia}。`;

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
    localStorage.removeItem(STORAGE_KEY);
    setSettingsOpen(false);
  };

  const copySummary = async () => {
    const text = `${config.title}：${zoneLabel(config.zone)} ${formatTargetFull(
      targetDate,
      targetZone
    )}；北京时间 ${targetBeijing}；加州时间 ${targetCalifornia}。`;
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
                {zoneLabel(config.zone)} {formatTargetFull(targetDate, targetZone)}
              </p>
            </div>
            <div className="target-chip">
              <CalendarClock size={18} strokeWidth={2.2} />
              <span>{config.date}</span>
              <b>{config.time}</b>
            </div>
          </div>

          <div className="countdown-grid" aria-live="polite">
            <div className="count-unit">
              <strong>{now ? parts.days : "--"}</strong>
              <span>天</span>
            </div>
            <div className="count-unit">
              <strong>{now ? pad2(parts.hours) : "--"}</strong>
              <span>小时</span>
            </div>
            <div className="count-unit">
              <strong>{now ? pad2(parts.minutes) : "--"}</strong>
              <span>分钟</span>
            </div>
            <div className="count-unit">
              <strong>{now ? pad2(parts.seconds) : "--"}</strong>
              <span>秒</span>
            </div>
          </div>

          <div className="mobile-clock-panel" aria-label="手机双时钟">
            <ClockCard tone="beijing" label="北京时间" zone={ZONES.beijing} now={now} targetDate={targetDate} />
            <ClockCard tone="california" label="加州时间" zone={ZONES.california} now={now} targetDate={targetDate} />
          </div>

          <div className="summary-strip">
            <div>
              <p className="micro-label">考试锚点</p>
              <p>{now ? summary : "正在同步设备时间"}</p>
            </div>
            <div className="hours-box">
              <span>{totalHours}</span>
              <b>小时</b>
            </div>
          </div>

          <div className="anchor-list">
            <div>
              <Compass size={17} strokeWidth={2.2} />
              <span>北京</span>
              <b>{targetBeijing}</b>
            </div>
            <div>
              <Plane size={17} strokeWidth={2.2} />
              <span>加州</span>
              <b>{targetCalifornia}</b>
            </div>
          </div>
        </div>

        <aside className="side-panel">
          <div className="visual-panel">
            <TimeRibbon now={now} />
          </div>
          <div className="clock-stack">
            <ClockCard tone="beijing" label="北京时间" zone={ZONES.beijing} now={now} targetDate={targetDate} />
            <ClockCard tone="california" label="加州时间" zone={ZONES.california} now={now} targetDate={targetDate} />
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
