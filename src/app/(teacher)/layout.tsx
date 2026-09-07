import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { TeacherSidebar } from "@/components/layout/TeacherSidebar";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();

  if (!session) {
    redirect("/login?role=TEACHER");
  }

  if (session.user.role !== "TEACHER" && session.user.role !== "SUPER_ADMIN") {
    redirect("/student/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopNavbar user={session.user} />
      <div className="flex flex-1">
        <TeacherSidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
