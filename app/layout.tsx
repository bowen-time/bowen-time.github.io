import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "考试倒计时 | Time Anchor",
  description: "北京时间和加州时间考试倒计时。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
