"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Mail,
  GraduationCap,
  Calendar,
  BookOpen,
  Award,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface StudentData {
  id: string;
  studentCode: string | null;
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  class: {
    id: string;
    name: string;
    grade: number;
    subject: string;
  };
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [classList, setClassList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const resClasses = await fetch("/api/classes");
        if (resClasses.ok) {
          const classes = await resClasses.json();
          setClassList(classes);

          // Fetch all students across classes
          const allStudents: StudentData[] = [];
          for (const c of classes) {
            const resMembers = await fetch(`/api/classes/${c.id}/students`);
            if (resMembers.ok) {
              const members = await resMembers.json();
              members.forEach((m: { id: string; studentCode: string | null; joinedAt: string; user: { id: string; fullName: string; email: string; avatarUrl: string | null } }) => {
                allStudents.push({
                  id: m.id,
                  studentCode: m.studentCode,
                  joinedAt: m.joinedAt,
                  user: m.user,
                  class: { id: c.id, name: c.name, grade: c.grade, subject: c.subject },
                });
              });
            }
          }
          setStudents(allStudents);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = students.filter((s) => {
    const nameMatch =
      s.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.user.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(search.toLowerCase()));
    const classMatch = classFilter === "ALL" || s.class.id === classFilter;
    return nameMatch && classMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Danh Sách Học Sinh
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý toàn bộ danh sách học sinh theo các lớp học đang phụ trách
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email, mã học sinh..."
            className="pl-9 bg-slate-50 border-slate-200 text-sm focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-medium text-slate-500">Lớp:</span>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option value="ALL">Tất cả các lớp</option>
            {classList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Không tìm thấy học sinh nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Học sinh</th>
                  <th className="px-5 py-3.5">Mã học sinh</th>
                  <th className="px-5 py-3.5">Lớp học</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Ngày tham gia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {item.user.fullName.charAt(0)}
                      </div>
                      {item.user.fullName}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                      {item.studentCode || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="blue" className="text-xs">
                        {item.class.name}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {item.user.email}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {new Date(item.joinedAt).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
