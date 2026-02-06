import { createClient } from "@/lib/supabase/server";
import SubjectCard from "@/components/ui/SubjectCard";
import UserMenu from '@/components/ui/UserMenu';
import Link from 'next/link';
import { GraduationCap, LayoutDashboard } from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ดึงข้อมูลเฉพาะ status = 'published'
  const { data: examSets, error } = await supabase
    .from('exam_sets')
    .select(`
      id,
      name,
      description,
      duration,
      status,
      is_featured,
      exam_set_topics (
        question_count,
        topics (
          subjects (
            name
          )
        )
      )
    `)
    .eq('status', 'published') // กรองเฉพาะที่เผยแพร่แล้ว
    .order('is_featured', { ascending: false }) // เอาชุดแนะนำขึ้นก่อน
    .order('created_at', { ascending: false }); // ตามด้วยชุดที่สร้างล่าสุด

  if (error) console.error("Error fetching exam sets:", error);

  const formattedSets = examSets?.map(set => {
    // ดึงชื่อวิชาจากโครงสร้าง Nested Array ของ Supabase
    const topicItem = set.exam_set_topics?.[0];
    const subjects = (topicItem?.topics as any)?.subjects;
    
    const subjectName = Array.isArray(subjects) 
      ? subjects[0]?.name 
      : (subjects as any)?.name || "ทั่วไป";

    // คำนวณจำนวนข้อสอบทั้งหมดในชุด
    const totalQuestions = set.exam_set_topics?.reduce((sum, t) => sum + (t.question_count || 0), 0) || 0;

    return {
      id: set.id,
      name: set.name,
      description: set.description,
      subject: subjectName,
      duration: set.duration || 60,
      totalQuestions: totalQuestions,
      isFeatured: set.is_featured
    };
  }) || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-[32px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-4 tracking-tight">คลังชุดข้อสอบ ก.พ.</h2>
            <p className="text-blue-100/70 max-w-md font-medium">
              ฝึกฝนทักษะด้วยชุดข้อสอบมาตรฐาน กรองเฉพาะวิชาที่ต้องการทดสอบได้ทันที
            </p>
          </div>
          {/* Background Decor */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </section>

        {/* Exam List Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
              <LayoutDashboard className="text-blue-600" size={24} />
              ชุดข้อสอบที่เปิดให้สอบ ({formattedSets.length})
            </h2>
          </div>

          {formattedSets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {formattedSets.map((examSet) => (
                <div key={examSet.id} className="relative">
                  {/* แสดงป้ายแนะนำถ้าเป็น Featured */}
                  {examSet.isFeatured && (
                    <div className="absolute -top-3 -right-3 z-20 bg-amber-400 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full shadow-lg border-2 border-white uppercase tracking-wider">
                      Recommended
                    </div>
                  )}
                  <SubjectCard
                    id={examSet.id}
                    title={examSet.name}
                    subject={examSet.subject}
                    description={examSet.description || ""}
                    totalQuestions={examSet.totalQuestions}
                    duration={examSet.duration}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">ยังไม่มีชุดข้อสอบที่เปิดให้ใช้งานในขณะนี้</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}