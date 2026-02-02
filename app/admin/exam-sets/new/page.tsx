import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewExamSetForm from '@/components/admin/NewExamSetForm'
export default async function NewQuestionPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 🔒 check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">เพิ่มชุดข้อสอบ</h1>
      <NewExamSetForm />
    </div>
  )
}
