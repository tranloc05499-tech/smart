"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  FileText,
  HelpCircle,
  BarChart3,
  Sparkles,
  Settings,
  GraduationCap,
  PenTool,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/teacher/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/teacher/classes", label: "Lớp học", icon: GraduationCap },
  { href: "/teacher/students", label: "Học sinh", icon: Users },
  { href: "/teacher/assignments", label: "Bài tập", icon: FileCheck },
  { href: "/teacher/exams", label: "Đề thi", icon: FileText },
  { href: "/teacher/questions", label: "Ngân hàng câu hỏi", icon: HelpCircle },
  { href: "/teacher/grading", label: "Chấm bài", icon: PenTool },
  { href: "/teacher/analytics", label: "Thống kê", icon: BarChart3 },
  { href: "/teacher/ai-tools", label: "AI Tools", icon: Sparkles, highlight: true },
  { href: "/teacher/settings", label: "Cài đặt", icon: Settings },
];

export function TeacherSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Phân hệ Giáo viên
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                item.highlight && !isActive && "text-indigo-600 hover:bg-indigo-50/50"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-blue-600" : item.highlight ? "text-indigo-600" : "text-slate-400"
                )}
              />
              <span className="truncate">{item.label}</span>
              {item.highlight && (
                <span className="ml-auto text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 p-3.5 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-semibold text-blue-900 mb-1">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span>Trợ lý AI Giáo viên</span>
        </div>
        <p className="text-[11px] text-slate-500 mb-2">
          Upload file PDF/Word trích xuất đề thi & chấm tự luận tự động.
        </p>
        <div className="text-[10px] font-medium text-blue-700 bg-white/80 px-2 py-1 rounded border border-blue-200">
          Credits: <span className="font-bold text-blue-900">720 / 1000</span>
        </div>
      </div>
    </aside>
  );
}
