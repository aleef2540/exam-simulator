import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewQuestionForm from '@/components/admin/NewQuestionForm' // เราจะใช้ Form เดิมแต่ส่งข้อมูลเข้าไป

export default async function EditQuestionPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  
  const { id } = await params 
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

  // 📥 ดึงข้อมูลข้อสอบเดิมพร้อม Choices
  const { data: question } = await supabase
    .from('questions')
    .select(`
      *,
      choices (*)
    `)
    .eq('id', id)
    .single()

  if (!question) {
    redirect('/admin/questions') // ถ้าไม่พบข้อสอบให้ดีดกลับหน้าหลัก
  }

  console.log(question)


  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">แก้ไขข้อสอบ</h1>
        <span className="text-xs text-slate-400 font-mono">ID: {id}</span>
      </div>
      
      {/* ส่งข้อมูล question เข้าไปใน Form เดิม 
         เราต้องไปปรับ NewQuestionForm ให้รับ props ชื่อ initialData ได้ 
      */}
      <NewQuestionForm initialData={question} />
    </div>
  )
}