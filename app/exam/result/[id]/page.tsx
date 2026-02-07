import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Timer as TimerIcon, Trophy, ArrowRight, LayoutDashboard, Target, Notebook } from 'lucide-react'
// ปรับ Path ให้ตรงกับที่คุณสร้างไฟล์ ReviewSection ไว้ครับ
import ReviewSection from '@/components/exam/ReviewSection'

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: attempt, error } = await supabase
        .from('exam_attempts')
        .select(`
      *, 
      exam_sets ( name ),
      exam_answer_details (
        id,
        selected_choice_id,
        is_correct,
        questions (
          id,
          question_text,
          question_type,
          choices (
            id,
            choice_text,
            is_correct
          )
        )
      )
    `)
        .eq('id', id)
        .single()

    if (error || !attempt) return notFound()

    const topicResults = attempt.topic_results as Record<string, { correct: number; total: number; name: string }>
    const durationInSeconds = Math.floor((new Date(attempt.completed_at).getTime() - new Date(attempt.started_at).getTime()) / 1000)
    const minutes = Math.floor(durationInSeconds / 60)
    const seconds = durationInSeconds % 60

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans antialiased text-slate-900 pb-32">
            <div className="max-w-7xl mx-auto px-8 py-12">

                {/* --- ส่วนสรุปผล (Summary) --- */}
                <div className="max-w-5xl mx-auto mb-8">
                    <div className="mb-10 text-center md:text-left">
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
                            {attempt.exam_sets?.name}
                        </h1>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">
                            Performance Summary Report
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        {/* Score Card */}
                        <div className="bg-white rounded-[40px] border border-slate-200 p-1 flex items-center shadow-sm">
                            <div className="flex-1 bg-gradient-to-br from-white to-indigo-50/30 rounded-[36px] p-8 flex items-center justify-between">
                                <div className="space-y-1">
                                    {/* เปลี่ยนจาก <p> เป็น <div> */}
                                    <div className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                        {/* div วงกลมเล็กๆ อยู่ข้างใน div ใหญ่ได้ตามปกติ */}
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        Score achieved
                                    </div>

                                    <div className="flex items-end gap-1">
                                        <span className="text-7xl font-black text-slate-900 tracking-tighter leading-none">
                                            {attempt.score}
                                        </span>
                                        <span className="text-xl font-bold text-indigo-300 mb-1">
                                            / {attempt.total_questions}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 bg-indigo-600 text-white rounded-3xl shadow-lg shadow-indigo-200">
                                    <Trophy size={32} />
                                </div>
                            </div>
                        </div>

                        {/* Time Card */}
                        <div className="bg-white rounded-[40px] border border-slate-200 p-1 flex items-center shadow-sm">
                            <div className="flex-1 bg-gradient-to-br from-white to-orange-50/30 rounded-[36px] p-8 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Completion time
                                    </p>
                                    <div className="flex items-end gap-1 font-black">
                                        <span className="text-7xl text-slate-900 tracking-tighter leading-none">{minutes}</span>
                                        <span className="text-xl text-orange-400 mb-1 mr-2">m</span>
                                        <span className="text-7xl text-slate-900 tracking-tighter leading-none">{seconds}</span>
                                        <span className="text-xl text-orange-400 mb-1">s</span>
                                    </div>
                                </div>
                                <div className="p-5 bg-orange-500 text-white rounded-3xl shadow-lg shadow-orange-200">
                                    <TimerIcon size={32} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden mb-12">
                        {/* Header: ปรับ Padding ให้กระชับขึ้น */}
                        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                                    <Target size={18} />
                                </div>
                                <h2 className="text-lg font-black uppercase tracking-tight text-slate-800">วิเคราะห์รายหมวดหมู่</h2>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100">
                                Topic Insights
                            </span>
                        </div>

                        {/* Content: ปรับ Grid gap และ Padding ให้สมส่วน */}
                        <div className="p-8 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            {Object.values(topicResults).map((topic, index) => {
                                const percentage = Math.round((topic.correct / topic.total) * 100);

                                // กำหนดสีตามเปอร์เซ็นต์ (Option เสริม)
                                const barColor = percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-indigo-600' : 'bg-rose-500';

                                return (
                                    <div key={index} className="group">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="space-y-0.5">
                                                <h4 className="font-bold text-slate-700 text-base group-hover:text-indigo-600 transition-colors">
                                                    {topic.name}
                                                </h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    Accuracy: {percentage}%
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xl font-black text-slate-900">{topic.correct}</span>
                                                <span className="text-xs font-bold text-slate-300 ml-1">/ {topic.total}</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar: ปรับให้ดู Smooth และมีขนาดพอดีสายตา */}
                                        <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full ${barColor} transition-all duration-1000 ease-out rounded-full shadow-sm`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* ACTIONS BUTTONS */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-16 mb-20">
                        <Link href="/" className="w-full sm:w-auto min-w-[220px] px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[22px] font-black flex items-center justify-center gap-3 hover:bg-slate-50 shadow-sm transition-all active:scale-95 rounded-2xl">
                            <LayoutDashboard size={20} /> กลับไปที่หน้าหลัก
                        </Link>
                        <Link href="/exam/result" className="w-full sm:w-auto min-w-[220px] px-12 py-5 bg-slate-900 text-white rounded-[22px] font-black flex items-center justify-center gap-3 hover:bg-black shadow-xl transition-all active:scale-95 rounded-2xl">
                            ดูสถิติ <Notebook size={20} />
                        </Link>
                    </div>
                </div>

                {/* --- ส่วนที่ปรับให้ไม่ชิด: REVIEW SECTION --- */}
                {/* เพิ่ม bg-slate-50/50 เพื่อให้เห็นขอบเขตชัดเจนว่า CSS ทำงานหรือไม่ */}
                <div className="w-full block clear-both pt-10 pb-20 mt-20 border-t-4 border-slate-900 bg-slate-50/30">
                    <div className="max-w-7xl mx-auto px-8">

                        <div className="mb-24 text-center">
                            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-900">
                                Review Answers
                            </h2>
                            <div className="h-2 w-20 bg-indigo-600 mx-auto mt-8 rounded-full" />
                            <p className="text-slate-500 font-bold text-base mt-6 mb-6 uppercase tracking-[0.3em]">
                                ตรวจสอบเฉลยและวิเคราะห์รายข้อ
                            </p>
                        </div>

                        {/* เช็คให้ชัวร์ว่า ReviewSection มีของข้างใน */}
                        <div className="relative z-10">
                            <ReviewSection
                                details={attempt.exam_answer_details}
                                totalQuestions={attempt.total_questions}
                            />
                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}