import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Users,
  Clock,
  BrainCircuit,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* 1. Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                Edu<span className="text-blue-600">Portal</span>
              </span>
              <span className="ml-2 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 hidden sm:inline-block">
                LMS + Exam Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/exam/join">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                🎯 Vào phòng thi
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Đăng nhập
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 px-6 max-w-7xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span>Hệ thống LMS & Khảo Thí Trực Tuyến Thế Hệ Mới Chuẩn Việt Nam</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight md:leading-tight">
          Nền tảng Quản Lý Học Tập,{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
            Tạo Đề & Khảo Thí Thông Minh
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Phân rã độc lập và tối ưu toàn diện: <strong>LMS + Exam Engine + Ngân hàng câu hỏi + Tự động chấm điểm + AI Parsing Word/PDF + Classroom Analytics</strong>.
        </p>

        {/* Quick entry links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link href="/login">
            <Button size="lg" className="h-12 px-6 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25">
              <span>Cổng Giáo Viên (Teacher)</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="h-12 px-6 border-slate-300 hover:bg-slate-100">
              <GraduationCap className="h-5 w-5 mr-1 text-emerald-600" />
              <span>Cổng Học Sinh (Student)</span>
            </Button>
          </Link>
          <Link href="/exam/join?code=8F3K2A">
            <Button size="lg" variant="secondary" className="h-12 px-6 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100">
              <span>Làm bài thi mẫu (8F3K2A)</span>
            </Button>
          </Link>
        </div>

      </section>

      {/* 4. Core Features Grid */}
      <section className="py-16 bg-white border-y border-slate-200/80 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Phân Rã Thành Các Engine Chuyên Biệt
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
              Không chỉ dừng lại ở &quot;tạo đề và giao bài&quot;, hệ thống được xây dựng như một giải pháp EdTech quy mô lớn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all hover:shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Quản Lý Lớp Học & Bài Tập</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Tạo lớp học, cấp mã tham gia, import danh sách học sinh từ Excel. Giao bài tập tự luận đa phương tiện (PDF, Docx, Hình ảnh) với phiên bản nộp lại.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all hover:shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Exam Engine & Realtime Autosave</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Timer đếm ngược chuẩn server-side chống đổi đồng hồ máy tính. Snapshot câu hỏi cố định và cơ chế autosave từng câu trả lời theo thời gian thực.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all hover:shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">AI Document Parser & Grading</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Trợ lý AI số hóa file Word/PDF trích xuất câu hỏi, đáp án có cấu trúc JSON Schema kèm validator nghiêm ngặt và hỗ trợ chấm tự luận theo Rubric.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6 text-xs text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <span>EduPortal © 2026 — Nền tảng LMS & Thi Trực Tuyến Độc Lập</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white transition-colors">Đăng nhập</Link>
            <Link href="/register" className="hover:text-white transition-colors">Đăng ký</Link>
            <Link href="/exam/join" className="hover:text-white transition-colors">Vào phòng thi</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
