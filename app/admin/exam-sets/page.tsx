import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExamSetList from '@/components/admin/ExamSetList'

export default async function AdminExamSetsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const { data, error } = await supabase
    .from('exam_sets')
    .select(`
      id,
      name,
      description,
      duration,
      exam_set_topics (
        question_count,
        sort_order,
        topics (
          name
        )
      )
    `)
    .order('created_at', { ascending: false })
    .order('sort_order', { foreignTable: 'exam_set_topics', ascending: true }) // เรียง Topics ตามลำดับที่จัดไว้

  if (error) {
    console.error(error)
    throw new Error('โหลดชุดข้อสอบไม่สำเร็จ')
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">📦 ชุดข้อสอบ</h1>
      <ExamSetList examSets={data ?? []} />
    </div>
  )
}