import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { StudentSidebar } from "@/components/layout/StudentSidebar";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();

  if (!session) {
    redirect("/login?role=STUDENT");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopNavbar user={session.user} />
      <div className="flex flex-1">
        <StudentSidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
