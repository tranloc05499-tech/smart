import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduPortal — Hệ Thống Quản Lý Học Tập & Thi Trực Tuyến Độc Lập",
  description: "Nền tảng LMS, ngân hàng câu hỏi, tạo đề thi, chấm điểm tự động và AI phân tích học tập toàn diện cho giáo viên và học sinh.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
