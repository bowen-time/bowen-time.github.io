"use client";

import { useEffect, useRef } from "react";
import { formatTime, ZONES } from "@/lib/time";

type TimeRibbonProps = {
  now: Date | null;
};

export function TimeRibbon({ now }: TimeRibbonProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;
      const computed = getComputedStyle(document.documentElement);
      const ink = computed.getPropertyValue("--ink").trim() || "#111814";
      const muted = computed.getPropertyValue("--muted").trim() || "#607068";
      const line = computed.getPropertyValue("--line").trim() || "#dfe5dc";
      const teal = computed.getPropertyValue("--teal").trim() || "#0f766e";
      const coral = computed.getPropertyValue("--coral").trim() || "#e0573f";

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = computed.getPropertyValue("--visual-bg").trim() || "#eef4ef";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      for (let x = 22; x < width; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 22; y < height; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const pad = Math.max(22, width * 0.08);
      const baseY = height * 0.58;
      const ca = { x: pad + 12, y: baseY + height * 0.1 };
      const bj = { x: width - pad - 12, y: baseY - height * 0.16 };

      ctx.lineWidth = 3;
      const routeGradient = ctx.createLinearGradient(ca.x, ca.y, bj.x, bj.y);
      routeGradient.addColorStop(0, teal);
      routeGradient.addColorStop(1, coral);
      ctx.strokeStyle = routeGradient;
      ctx.beginPath();
      ctx.moveTo(ca.x, ca.y);
      ctx.bezierCurveTo(width * 0.28, height * 0.12, width * 0.64, height * 0.88, bj.x, bj.y);
      ctx.stroke();

      const marker = (x: number, y: number, color: string, label: string, sublabel: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.86)";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = "800 13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = ink;
        ctx.textAlign = x > width * 0.7 ? "right" : "left";
        ctx.fillText(label, x > width * 0.7 ? x - 13 : x + 13, y - 10);

        ctx.font = "700 12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = muted;
        ctx.fillText(sublabel, x > width * 0.7 ? x - 13 : x + 13, y + 9);
      };

      marker(
        ca.x,
        ca.y,
        teal,
        "加州",
        now ? formatTime(now, ZONES.california) : "--:--"
      );
      marker(
        bj.x,
        bj.y,
        coral,
        "北京",
        now ? formatTime(now, ZONES.beijing) : "--:--"
      );

      ctx.fillStyle = ink;
      ctx.font = "900 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("北京 / 加州双时钟", pad, 34);
      ctx.fillStyle = muted;
      ctx.font = "700 12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("考试时间已按两地自动换算", pad, 54);
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [now]);

  return <canvas ref={canvasRef} className="time-ribbon" aria-label="timezone route visualization" />;
}
