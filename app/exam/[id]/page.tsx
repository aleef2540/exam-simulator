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

export default async function ExamPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const supabase = await createClient()
  const { id } = await params 

  // 1. ตรวจสอบ User Session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. ดึงข้อมูล Exam Set (เพิ่ม sort_order ใน select)
  const { data: examSet, error: examSetError } = await supabase
    .from('exam_sets')
    .select(`
      id,
      name,
      duration,
      exam_set_topics (
        question_count,
        sort_order,
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

  // 3. จัดการดึงข้อสอบ โดยเรียงลำดับตาม Topic ก่อน แล้วค่อยสุ่มข้อข้างใน
  const allQuestions: Question[] = (examSet.exam_set_topics as any[])
    // เรียงลำดับ Topic (เช่น อนุกรม ต้องมาก่อน คณิต)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .flatMap((est) => {
      const rawQuestions = est.topics?.questions || []
      
      // Shuffle เฉพาะข้อสอบ "ภายใน" Topic เดียวกัน
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
      duration={examSet.duration || 60} 
    />
  )
}