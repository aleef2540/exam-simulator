import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuestionsTable from '@/components/admin/QuestionList'

export default async function AdminQuestionsPage() {
  const supabase = await createClient()

  // check login
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  // load questions
  const { data, error } = await supabase
  .from('questions')
  .select(`
    id,
    question_text,
    question_image_url,
    created_at,
    subjects!questions_subject_id_fkey (
      name
    ),
    topics!questions_topic_id_fkey (
      name
    ),
    choices (
      id,
      choice_text,
      choice_image_url,
      is_correct
    )
  `).order('created_at', { ascending: false })
    
    //console.log(data)

  if (error) {
    console.error(error)
    throw new Error('โหลดข้อสอบไม่สำเร็จ')
  }

  // 1. กำหนด Interface ให้ชัดเจน (แบนและใช้ง่าย)
interface FormattedQuestion {
  id: string;
  question_text: string;
  question_image_url: string | null;
  subject_name: string;
  topic_name: string;
  created_at: string;
  choices: any[];
}

// 2. แปลงข้อมูล (Transform)
const formattedQuestions: FormattedQuestion[] = (data || []).map((q: any) => {
  // แก้ปัญหา Array/Object mismatch โดยการเช็คว่าเป็น Array หรือไม่
  const topicData = Array.isArray(q.topics) ? q.topics[0] : q.topics;
  const subjectData = Array.isArray(q.subjects) ? q.subjects[0] : q.subjects;

  return {
    id: q.id,
    question_text: q.question_text,
    question_image_url: q.question_image_url,
    subject_name: subjectData?.name || 'ไม่ระบุวิชา',
    topic_name: topicData?.name || 'ไม่ระบุหัวข้อ',
    created_at: q.created_at,
    choices: q.choices || [],
  };
});

  //console.log(formattedQuestions)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">จัดการข้อสอบ</h1>
      <QuestionsTable questions={formattedQuestions ?? []} />
    </div>
  )
}
