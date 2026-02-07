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
  group_id?: string | null
  group_order?: number | null
  topic_id: string
  topic_name: string
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

  // 2. ดึงข้อมูล Exam Set พร้อมความสัมพันธ์ของ Topics และ Questions
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
          id,
          name,
          questions (
            id,
            question_text,
            question_type,
            question_image_url,
            group_id,
            group_order,
            choices (
              id,
              choice_text,
              sort_order
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

  // 3. จัดการเตรียมข้อมูลข้อสอบ
  const allQuestions: Question[] = (examSet.exam_set_topics as any[])
    // เรียงลำดับหมวดหมู่ตาม sort_order
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .flatMap((est) => {
      const topicId = est.topics?.id
      const topicName = est.topics?.name
      const rawQuestions = est.topics?.questions || []
      
      // เรียงลำดับเบื้องต้นเพื่อให้ Data นิ่ง (Refresh แล้วไม่โดดไปมาที่ Server)
      // เราจะไปสุ่มลำดับจริงครั้งเดียวที่ ExamClient
      const preparedQuestions = [...rawQuestions].sort((a, b) => {
        if (a.group_id && b.group_id && a.group_id === b.group_id) {
          return (a.group_order || 0) - (b.group_order || 0)
        }
        return a.id.localeCompare(b.id)
      })

      // เลือกจำนวนข้อตามที่ Exam Set กำหนดในหมวดนั้นๆ
      return preparedQuestions.slice(0, est.question_count).map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        image_url: q.question_image_url,
        group_id: q.group_id,
        group_order: q.group_order,
        topic_id: topicId,
        topic_name: topicName,
        choices: q.choices.map((c: any) => ({
          id: c.id,
          choice_text: c.choice_text,
          sort_order: c.sort_order
        })),
      }))
    })

  // 4. กรณีไม่มีข้อสอบ
  if (allQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center p-10 bg-white rounded-[24px] border border-slate-300 shadow-sm max-w-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🧩</div>
          <h2 className="text-slate-800 font-black text-xl mb-2">ยังไม่มีข้อสอบ</h2>
          <p className="text-slate-500 text-sm mb-6">ขณะนี้ยังไม่มีข้อสอบบรรจุในชุดที่คุณเลือก</p>
          <a href="/" className="block w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 text-center">
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    )
  }

  // 5. ส่ง Data ให้ ExamClient ไปจัดการต่อ (Shuffle & Render & Save)
  return (
    <ExamClient 
      questions={allQuestions} 
      title={examSet.name} 
      duration={examSet.duration || 60} 
      examSetId={examSet.id}
      userId={user.id}
    />
  )
}