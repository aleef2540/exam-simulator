import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExamClient from '@/components/exam/ExamClient'

// --- Types ---
type Choice = {
  id: string
  choice_text: string | null
}

type Question = {
  id: string
  question_text: string
  question_type: 'text' | 'image'
  image_url?: string | null
  choices: Choice[]
}

// 1. เปลี่ยนการรับค่า params ให้รองรับ Promise
export default async function ExamPage({ 
  params 
}: { 
  params: Promise<{ id: string }> // กำหนด type เป็น Promise
}) {
  const supabase = await createClient()
  
  // 2. ต้อง await params ก่อนดึง id ออกมา
  const { id } = await params 

  // 1. ตรวจสอบ User Session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. ดึงข้อมูล Exam Set (คราวนี้ id จะไม่เป็น undefined แล้ว)
  const { data: examSet, error: examSetError } = await supabase
    .from('exam_sets')
    .select(`
      id,
      name,
      duration,
      exam_set_topics (
        question_count,
        topics (
          questions (
            id,
            question_text,
            question_type,
            question_image_url,
            choices (
              id,
              choice_text
            )
          )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (examSetError || !examSet) {
    console.error("Exam Set Fetch Error:", examSetError)
    return notFound()
  }

  // 3. จัดการสุ่มข้อสอบตามสัดส่วน (question_count) ที่แอดมินตั้งไว้
  const allQuestions: Question[] = (examSet.exam_set_topics as any[]).flatMap((est) => {
    const rawQuestions = est.topics?.questions || []
    
    // Shuffle และ Slice ตามจำนวนที่ต้องการในแต่ละหัวข้อ
    return [...rawQuestions]
      .sort(() => 0.5 - Math.random()) 
      .slice(0, est.question_count)
      .map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        image_url: q.question_image_url,
        choices: q.choices.map((c: any) => ({
          id: c.id,
          choice_text: c.choice_text,
        })),
      }))
  })

  // 4. กรณีไม่มีข้อสอบในชุดนี้
  if (allQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 font-bold text-lg">⚠️ ยังไม่มีข้อสอบบรรจุในชุดนี้</p>
          <button onClick={() => redirect('/')} className="mt-4 text-blue-600 font-semibold underline">กลับหน้าหลัก</button>
        </div>
      </div>
    )
  }

  // 5. ส่งข้อมูลไปยัง Client Component
  return (
    <ExamClient 
      questions={allQuestions} 
      title={examSet.name} 
      duration={examSet.duration || 60} // ส่งเวลาจริง (นาที) ไปให้หน้าสอบ
    />
  )
}