"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck,
  FileText,
  GraduationCap,
  History,
  Award,
  Bell,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const studentNavItems = [
  { href: "/student/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/student/assignments", label: "Bài tập được giao", icon: FileCheck },
  { href: "/student/exams", label: "Đề thi của tôi", icon: FileText },
  { href: "/student/classes", label: "Lớp học", icon: GraduationCap },
  { href: "/student/history", label: "Lịch sử làm bài", icon: History },
  { href: "/student/scores", label: "Bảng điểm & Nhận xét", icon: Award },
  { href: "/student/notifications", label: "Thông báo", icon: Bell },
];

export function StudentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Không Gian Học Sinh
        </div>
        {studentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-emerald-600" : "text-slate-400"
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-xs text-slate-600">
        <div className="font-semibold text-emerald-900 mb-1 flex items-center justify-between">
          <span>Vào thi bằng Link</span>
          <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <p className="text-[11px] text-slate-500 mb-2">
          Có mã đề thi từ giáo viên? Nhập mã để vào thi ngay.
        </p>
        <Link
          href="/exam/join"
          className="block text-center font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-1.5 transition-colors"
        >
          Nhập mã đề thi
        </Link>
      </div>
    </aside>
  );
}
