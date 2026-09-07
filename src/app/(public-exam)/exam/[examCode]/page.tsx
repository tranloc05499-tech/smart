import { redirect } from "next/navigation";

export default async function ExamCodeDirectPage({
  params,
}: {
  params: Promise<{ examCode: string }>;
}) {
  const { examCode } = await params;
  redirect(`/exam/join?code=${encodeURIComponent(examCode)}`);
}
