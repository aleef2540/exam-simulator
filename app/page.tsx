import { createClient } from "@/lib/supabase/server";
import SubjectCard from "@/components/ui/SubjectCard";
import UserMenu from '@/components/ui/UserMenu';
import Link from 'next/link';
import { GraduationCap, LayoutDashboard } from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ดึงข้อมูลตามโครงสร้าง: exam_sets -> exam_set_topics -> topics -> subjects
  const { data: examSets, error } = await supabase
    .from('exam_sets')
    .select(`
      id,
      name,
      description,
      duration,
      exam_set_topics (
        question_count,
        topics (
          subjects (
            name
          )
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) console.error("Error:", error);

  // ปรับโครงสร้างข้อมูลเพื่อให้ Component ใช้ง่ายขึ้น (แก้จุด Error)
  const formattedSets = examSets?.map(set => {
    
    // แก้ไข: เข้าถึง subjects[0].name เพราะ Supabase คืนค่าเป็น Array
    const topicData = set.exam_set_topics?.[0]?.topics;
    const subjects = (topicData as any)?.subjects;
    
    const subjectName = Array.isArray(subjects) 
      ? subjects[0]?.name 
      : (subjects as any)?.name || "ทั่วไป";

    const totalQuestions = set.exam_set_topics?.reduce((sum, t) => sum + (t.question_count || 0), 0);

    return {
      id: set.id,
      name: set.name,
      description: set.description,
      subject: subjectName,
      duration: set.duration || 60, // เพิ่ม duration เข้าไปใน object
      totalQuestions: totalQuestions
    };
  }) || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white/75 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-2 rounded-xl">
              <GraduationCap className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">EXAM HUB</h1>
          </div>
          {user ? <UserMenu email={user.email!} /> : (
            <Link href="/login" className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        <section className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-[32px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-4 tracking-tight">คลังชุดข้อสอบ ก.พ.</h2>
            <p className="text-blue-100/70 max-w-md font-medium">เลือกชุดข้อสอบที่คุณต้องการทดสอบได้จากรายการด้านล่าง</p>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <LayoutDashboard className="text-blue-600" size={24} />
            ชุดข้อสอบทั้งหมด ({formattedSets.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {formattedSets.map((examSet) => (
              <SubjectCard
                key={examSet.id}
                id={examSet.id}
                title={examSet.name}
                subject={examSet.subject}
                description={examSet.description || ""}
                totalQuestions={examSet.totalQuestions}
                duration={examSet.duration} // ส่งเวลาไปแสดงผลที่ Card
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}