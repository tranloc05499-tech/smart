"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Save,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function TeacherSettingsPage() {
  const [fullName, setFullName] = useState("Nguyễn Văn An");
  const [email, setEmail] = useState("teacher@edutech.vn");
  const [school, setSchool] = useState("THPT Chuyên Hà Nội - Amsterdam");
  const [phone, setPhone] = useState("0912345678");
  const [emailNotify, setEmailNotify] = useState(true);
  const [antiCheatDefault, setAntiCheatDefault] = useState("1");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const preferences = window.localStorage.getItem("teacher_preferences");
      if (preferences) {
        const stored = JSON.parse(preferences) as { school?: string; emailNotify?: boolean; antiCheatDefault?: string };
        if (stored.school) setSchool(stored.school);
        if (typeof stored.emailNotify === "boolean") setEmailNotify(stored.emailNotify);
        if (stored.antiCheatDefault) setAntiCheatDefault(stored.antiCheatDefault);
      }
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setFullName(data.user.fullName);
        setEmail(data.user.email);
        setPhone(data.user.phone || "");
      }
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể lưu hồ sơ");
      window.localStorage.setItem("teacher_preferences", JSON.stringify({ school, emailNotify, antiCheatDefault }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không thể lưu hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Cài Đặt Tài Khoản & Hệ Thống
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý thông tin hồ sơ giáo viên, cấu hình mặc định đề thi và thông báo
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="h-4 w-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Thông tin giáo viên</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <Input
                disabled
                value={email}
                className="text-sm bg-slate-50 text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trường học / Tổ chức giảng dạy
              </label>
              <Input
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Exam Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="h-4 w-4 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Cấu hình đề thi mặc định</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cấp độ chống gian lận mặc định khi tạo đề
            </label>
            <select
              value={antiCheatDefault}
              onChange={(e) => setAntiCheatDefault(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Mức 0: Tự do, không giám sát</option>
              <option value="1">Mức 1: Bắt sự kiện chuyển tab và ghi nhật ký</option>
              <option value="2">Mức 2: Toàn màn hình bắt buộc + Cảnh báo tức thì</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="notify"
              checked={emailNotify}
              onChange={(e) => setEmailNotify(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="notify" className="text-xs text-slate-700 select-none">
              Nhận thông báo qua email khi có học sinh hoàn thành bài thi
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {error && <p className="text-xs text-red-600">{error}</p>}
          {saved && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <CheckCircle className="h-4 w-4" />
              Đã lưu thay đổi thành công!
            </div>
          )}
          <Button
            type="submit"
            disabled={saving}
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs"
          >
            <Save className="h-4 w-4" />
            {saving ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </div>
      </form>
    </div>
  );
}
