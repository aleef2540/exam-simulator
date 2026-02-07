import { createClient } from '@/lib/supabase/server'
import { Trophy, Target, Clock, TrendingUp, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function StatisticsPage() {
  const supabase = await createClient()

  const { data: attempts, error } = await supabase
    .from('exam_attempts')
    .select(`
      *,
      exam_sets ( name )
    `)
    .order('completed_at', { ascending: false })

  if (error || !attempts) return <div className="p-10 text-center">กำลังโหลดข้อมูล...</div>
  if (attempts.length === 0) return <div className="p-10 text-center font-bold">ยังไม่มีข้อมูลการสอบ</div>

  // --- LOGIC การคำนวณที่ถูกต้อง ---
  
  const totalAttempts = attempts.length
  const totalQuestions = attempts.reduce((acc, curr) => acc + (curr.total_questions || 0), 0)
  const totalCorrect = attempts.reduce((acc, curr) => acc + (curr.score || 0), 0)
  const accuracy = (totalCorrect / totalQuestions) * 100 || 0

  // แก้ไขการคำนวณเวลา: รวมวินาทีจากทุกพยายามสอบ
  const totalSeconds = attempts.reduce((acc, curr) => {
    const start = new Date(curr.started_at).getTime()
    const end = new Date(curr.completed_at).getTime()
    return acc + Math.floor((end - start) / 1000)
  }, 0)
  const totalMinutes = Math.floor(totalSeconds / 60)

  // ดึงข้อมูล Topic Mastery จริงจาก Database
  const topicStats: Record<string, { correct: number; total: number; name: string }> = {}
  attempts.forEach(attempt => {
    const results = attempt.topic_results as Record<string, any>
    if (results) {
      Object.entries(results).forEach(([id, data]) => {
        if (!topicStats[id]) topicStats[id] = { correct: 0, total: 0, name: data.name }
        topicStats[id].correct += data.correct
        topicStats[id].total += data.total
      })
    }
  })

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      <div className="max-w-7xl mx-auto px-8 py-12">
        
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs">สถิติและการพัฒนาการสอบของคุณ</p>
        </div>

        {/* --- SECTION 1: OVERVIEW CARDS (ใช้ Grid แทน Flex เพื่อความ Responsive) --- */}
        <div className="flex justify-center gap-8">
          <StatCard title="สอบไปแล้ว" value={`${totalAttempts} ครั้ง`} icon={<Clock size={24} className="text-blue-600" />} bg="bg-blue-50" />
          <StatCard title="ทำไปแล้ว" value={`${totalQuestions} ข้อ`} icon={<TrendingUp size={24} className="text-indigo-600" />} bg="bg-indigo-50" />
          <StatCard title="เวลาที่ใช้ไป" value={`${totalMinutes} นาที`} icon={<Clock size={24} className="text-orange-500" />} bg="bg-orange-50" />
          <StatCard title="ความแม่นยำ" value={`${accuracy.toFixed(1)}%`} icon={<Target size={24} className="text-emerald-600" />} bg="bg-emerald-50" />
        </div>

        <div className="flex justify-center gap-8 mt-8">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              ประวัติการสอบล่าสุด
            </h3>
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">ชุดข้อสอบ</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">คะแนน</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">วันที่</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {attempts.slice(0, 5).map((attempt) => (
                    <tr key={attempt.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-800">{attempt.exam_sets?.name}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="font-black text-lg text-slate-900">{attempt.score}</span>
                        <span className="text-slate-300 text-sm font-bold ml-1">/ {attempt.total_questions}</span>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-400">
                        {new Date(attempt.completed_at).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link href={`/exam/result/${attempt.id}`} className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-600 hover:text-white transition-all">
                          ดูเฉลย <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-800">วิเคราะห์จุดแข็ง/จุดอ่อน</h3>
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
               <p className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest text-center">Mastery by Topic</p>
               <div className="space-y-6">
                  {Object.values(topicStats).length > 0 ? (
                    Object.values(topicStats).map((topic, index) => (
                      <TopicProgress 
                        key={index} 
                        name={topic.name} 
                        percentage={Math.round((topic.correct / topic.total) * 100)} 
                        color={((topic.correct / topic.total) * 100) >= 70 ? "bg-emerald-500" : "bg-rose-500"} 
                      />
                    ))
                  ) : (
                    <p className="text-center text-slate-300 text-sm">ยังไม่มีข้อมูลรายวิชา</p>
                  )}
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, bg }: any) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
      <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function TopicProgress({ name, percentage, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-bold">
        <span className="text-slate-700">{name}</span>
        <span className="text-slate-400">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}