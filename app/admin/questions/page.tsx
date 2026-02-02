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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">จัดการข้อสอบ</h1>
      <QuestionsTable questions={data ?? []} />
    </div>
  )
}
