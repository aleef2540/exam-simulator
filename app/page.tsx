import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubjectCard from "@/components/ui/SubjectCard";
import LogoutButton from "@/components/ui/LogoutButton";
import UserMenu from '@/components/ui/UserMenu';
import Link from 'next/link';



export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="
      bg-white/80
  backdrop-blur
  border-b border-slate-200/60
  sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-lg font-semibold tracking-tight">
            ระบบทดลองสอบ กพ
          </h1>

          {user ? (
            <UserMenu email={user.email!} />
          ) : (
            <Link
              href="/login"
              className="
              px-4 py-2
              rounded-lg
              bg-blue-600
              text-white
              hover:bg-blue-700
            "
            >
              เข้าสู่ระบบ
            </Link>
          )}


        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold mb-4">
          เลือกวิชาที่จะสอบ
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SubjectCard
            title="ภาษาไทย"
            subject="thai"
            description="การอ่านจับใจความ การใช้ภาษา"
          />
          <SubjectCard
            title="คณิตศาสตร์"
            subject="math"
            description="คำนวณ วิเคราะห์โจทย์"
          />
          <SubjectCard
            title="ภาษาอังกฤษ"
            subject="english"
            description="Grammar & Reading"
          />
        </div>
      </main>
    </div>
  );
}
