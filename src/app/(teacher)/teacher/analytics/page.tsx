"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface AnalyticsData {
  totalExams: number;
  totalAttempts: number;
  avgScore: number;
  passRate: number;
  scoreDistribution: { range: string; count: number }[];
  topStudents: { name: string; score: number; examTitle: string }[];
}

export default function TeacherAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const resExams = await fetch("/api/exams");
        if (resExams.ok) {
          const exams = await resExams.json();
          const allAttempts: { score: number | null; studentName: string; examTitle: string }[] = [];

          for (const ex of exams) {
            const resRes = await fetch(`/api/exams/${ex.id}/results`);
            if (resRes.ok) {
              const resData = await resRes.json();
              resData.forEach((r: { score: number | null; studentName: string }) => {
                if (r.score !== null) {
                  allAttempts.push({
                    score: r.score,
                    studentName: r.studentName,
                    examTitle: ex.title,
                  });
                }
              });
            }
          }

          const totalAttempts = allAttempts.length;
          const avgScore =
            totalAttempts > 0
              ? allAttempts.reduce((acc, c) => acc + (c.score || 0), 0) / totalAttempts
              : 0;
          const passCount = allAttempts.filter((a) => (a.score || 0) >= 5).length;
          const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;

          // Score distribution
          const dist = [
            { range: "0 - 4.9 (Chưa đạt)", count: allAttempts.filter((a) => (a.score || 0) < 5).length },
            { range: "5.0 - 6.4 (Trung bình)", count: allAttempts.filter((a) => (a.score || 0) >= 5 && (a.score || 0) < 6.5).length },
            { range: "6.5 - 7.9 (Khá)", count: allAttempts.filter((a) => (a.score || 0) >= 6.5 && (a.score || 0) < 8).length },
            { range: "8.0 - 10 (Giỏi/Xuất sắc)", count: allAttempts.filter((a) => (a.score || 0) >= 8).length },
          ];

          // Top students
          const sorted = [...allAttempts].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);

          setData({
            totalExams: exams.length,
            totalAttempts,
            avgScore: Number(avgScore.toFixed(1)),
            passRate,
            scoreDistribution: dist,
            topStudents: sorted.map((s) => ({
              name: s.studentName,
              score: s.score || 0,
              examTitle: s.examTitle,
            })),
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Thống Kê & Báo Cáo Học Tập
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Phân tích phổ điểm, tỷ lệ hoàn thành và xếp hạng học lực của các lớp
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase">Tổng số đề thi</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{data?.totalExams || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Đang hoạt động trong kỳ</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase">Lượt làm bài nộp</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{data?.totalAttempts || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Tất cả các phòng thi</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase">Điểm trung bình hệ thống</div>
          <div className="text-2xl font-bold text-amber-500 mt-2">{data?.avgScore || 0} / 10</div>
          <div className="text-[11px] text-slate-500 mt-1">Tính trên tất cả bài nộp</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase">Tỷ lệ đạt chuẩn</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{data?.passRate || 0}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Điểm số từ 5.0 trở lên</div>
        </div>
      </div>

      {/* Distribution & Top Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phổ điểm */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Phổ Điểm Học Sinh
          </h2>
          <div className="space-y-4">
            {data?.scoreDistribution.map((item) => {
              const maxCount = Math.max(...(data?.scoreDistribution.map((d) => d.count) || [1]), 1);
              const pct = Math.round((item.count / (data.totalAttempts || 1)) * 100);

              return (
                <div key={item.range} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{item.range}</span>
                    <span className="text-slate-500">{item.count} bài ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, (item.count / maxCount) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Học Sinh */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Học Sinh Điểm Cao Nhất
          </h2>
          {(!data?.topStudents || data.topStudents.length === 0) ? (
            <p className="text-sm text-slate-500 text-center py-8">Chưa có bài thi nào có điểm.</p>
          ) : (
            <div className="space-y-3">
              {data.topStudents.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      idx === 0
                        ? "bg-amber-100 text-amber-700"
                        : idx === 1
                        ? "bg-slate-200 text-slate-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.examTitle}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-emerald-600">{s.score.toFixed(1)}</span>
                    <span className="text-xs text-slate-400">/10</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
