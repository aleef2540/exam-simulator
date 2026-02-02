'use client'

import Link from 'next/link'
import { useState } from 'react'
import Image from 'next/image'
import ImageModal from '@/components/ui/ImageModal'
import { 
  Search, 
  ImageIcon, 
  CheckCircle2, 
  MoreHorizontal, 
  AlertCircle,
  Hash,
  BookOpen,
  Filter,
  Plus // เพิ่ม Icon Plus
} from 'lucide-react'

// --- Types ---
type Question = {
  id: string
  question_text: string | null
  question_image_url: string | null
  subjects: { name: string } | { name: string }[] | null
  topics: { name: string } | { name: string }[] | null
  choices: {
    id: string
    choice_text: string | null
    choice_image_url: string | null
    is_correct: boolean
  }[]
}

type Props = {
  questions: Question[]
}

export default function QuestionsList({ questions = [] }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const getDisplayName = (data: any) => {
    if (!data) return '-'
    if (Array.isArray(data)) return data[0]?.name || '-'
    return data.name || '-'
  }

  const filteredQuestions = questions.filter(q => {
    const text = (q.question_text || "").toLowerCase()
    const subject = getDisplayName(q.subjects).toLowerCase()
    const topic = getDisplayName(q.topics).toLowerCase()
    const term = searchTerm.toLowerCase()
    return text.includes(term) || subject.includes(term) || topic.includes(term)
  })

  // ฟังก์ชันสำหรับการเพิ่มข้อสอบ (ส่งไปหน้าใหม่ หรือเปิด Modal)
  const handleAddQuestion = () => {
    console.log("Navigate to add question page or open modal")
    // window.location.href = '/admin/questions/add' // ตัวอย่างการนำทาง
  }

  return (
    <div className="w-full space-y-4 font-sans text-slate-900">
      
      {/* --- Toolbar / Search & Add Button --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="ค้นหาโจทย์, วิชา หรือหัวข้อ..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-500 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200">
            <Filter size={16} />
            {filteredQuestions.length} / {questions.length}
          </div>

          <Link href="/admin/questions/new">
                    <button className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg active:scale-95">
                        <Plus size={18} />
                        เพิ่มข้อสอบใหม่
                    </button>
                </Link>

        </div>
      </div>

      {/* --- Table Section --- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4 w-52">หมวดหมู่</th>
                <th className="px-6 py-4">เนื้อหาโจทย์</th>
                <th className="px-6 py-4">ตัวเลือกคำตอบ</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 transition-colors align-top">
                    {/* หมวดหมู่ */}
                    <td className="px-6 py-5 space-y-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                          <BookOpen size={10} /> วิชา
                        </span>
                        <div className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-md inline-block max-w-full truncate">
                          {getDisplayName(q.subjects)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                          <Hash size={10} /> หัวข้อ
                        </span>
                        <div className="text-xs font-medium text-slate-600 truncate">
                          {getDisplayName(q.topics)}
                        </div>
                      </div>
                    </td>

                    {/* โจทย์ */}
                    <td className="px-6 py-5">
                      <div className="max-w-md space-y-3">
                        {q.question_text && (
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                            {q.question_text}
                          </p>
                        )}
                        {q.question_image_url && (
                          <button 
                            onClick={() => setPreviewImage(q.question_image_url)}
                            className="relative group block overflow-hidden rounded-xl border-2 border-slate-100 hover:border-blue-400 transition-all shadow-sm"
                          >
                            <Image
                              src={q.question_image_url}
                              alt="question"
                              width={240}
                              height={140}
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* ตัวเลือก */}
                    <td className="px-6 py-5">
                      <div className="grid grid-cols-2 gap-2.5 w-80">
                        {Array.from({ length: 4 }).map((_, i) => {
                          const c = q.choices[i]
                          if (!c) return <div key={i} className="h-12 border border-dashed border-slate-100 rounded-xl bg-slate-50/50"></div>
                          return (
                            <div key={i} className={`p-2.5 rounded-xl border text-[11px] flex flex-col gap-1.5 transition-all shadow-sm ${c.is_correct ? 'bg-green-50 border-green-400 text-green-800' : 'bg-white border-slate-200 text-slate-600'}`}>
                              <div className="flex items-center gap-1.5 font-bold truncate">
                                {c.is_correct ? <CheckCircle2 size={14} className="text-green-600 shrink-0" /> : <span className="text-[10px] text-slate-300 shrink-0 font-black">{i + 1}.</span>}
                                <span className="truncate">{c.choice_text || (c.choice_image_url ? "ดูรูปคำตอบ" : "-")}</span>
                              </div>
                              {c.choice_image_url && (
                                <div className="relative w-full h-12 rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
                                  <Image src={c.choice_image_url} alt={`choice ${i+1}`} fill className="object-contain p-1" />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </td>

                    {/* จัดการ */}
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-200">
                        <AlertCircle size={48} strokeWidth={1} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-500 font-bold">ไม่พบข้อสอบที่ต้องการ</p>
                        <p className="text-slate-400 text-xs text-balance">ลองเปลี่ยนคำค้นหา หรือสร้างข้อสอบใหม่ได้ทันที</p>
                      </div>
                      <button 
                        onClick={handleAddQuestion}
                        className="mt-2 flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all"
                      >
                        <Plus size={16} /> สร้างข้อสอบใหม่
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- Footer --- */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>* คลิกที่รูปโจทย์เพื่อดูขนาดใหญ่</span>
          <span>Total Records: {questions.length}</span>
        </div>
      </div>

      {previewImage && <ImageModal src={previewImage} onClose={() => setPreviewImage(null)} />}
    </div>
  )
}