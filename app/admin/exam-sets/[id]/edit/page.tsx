import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditExamSetForm from '@/components/admin/NewExamSetForm'

export default async function EditExamSetPage({ 
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

  // 🔒 Check Role Admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  // 📥 ดึงข้อมูลชุดข้อสอบเดิมพร้อมวิชาที่เกี่ยวข้อง (exam_set_topics)
  const { data: examSet } = await supabase
    .from('exam_sets')
    .select(`
      *,
      exam_set_topics (*)
    `)
    .eq('id', id)
    .single()

  if (!examSet) {
    redirect('/admin/exam-sets')
  }

  // 📥 ดึงรายชื่อหัวข้อ (Topics) ทั้งหมดเพื่อไปใช้ใน Dropdown ของฟอร์ม
  const { data: topics } = await supabase
    .from('topics')
    .select('id, name, subjects(name)')
    .order('name')

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">แก้ไขชุดข้อสอบ</h1>
          <p className="text-sm text-slate-500">ปรับปรุงข้อมูลชุดข้อสอบและจำนวนข้อในแต่ละหัวข้อ</p>
        </div>
        <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded font-mono">
          SET_ID: {id}
        </span>
      </div>
      
      {/* ส่งข้อมูลเข้าฟอร์ม */}
      <EditExamSetForm 
        initialData={examSet} 
      />
    </div>
  )
}