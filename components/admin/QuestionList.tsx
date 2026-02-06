'use client'

import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import ImageModal from '@/components/ui/ImageModal'
import { supabase } from '@/lib/supabase/client' 
import { useRouter } from 'next/navigation' 
import { Pencil, Trash2, Search, Plus, Filter, BookOpen, Hash, MoreHorizontal, AlertCircle, CheckCircle2, ArrowUpDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

// --- Types ---
type Question = {
  id: string
  question_text: string | null
  question_image_url: string | null
  subject_name: string
  topic_name: string
  created_at: string;
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
  const router = useRouter() 
  const [searchTerm, setSearchTerm] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [isDeleting, setIsDeleting] = useState<string | null>(null) 

  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const handleDelete = async (questionId: string, imageUrl: string | null) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อสอบข้อนี้? การกระทำนี้ไม่สามารถย้อนคืนได้')) return

    setIsDeleting(questionId)
    try {
      const { error: choiceError } = await supabase
        .from('choices')
        .delete()
        .eq('question_id', questionId)
      
      if (choiceError) throw choiceError

      if (imageUrl) {
        const filePath = imageUrl.split('/').pop()
        if (filePath) {
          await supabase.storage.from('question-images').remove([`questions/${filePath}`])
        }
      }

      const { error: qError } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (qError) throw qError

      alert('ลบข้อสอบสำเร็จ')
      router.refresh() 
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } finally {
      setIsDeleting(null)
    }
  }

  const uniqueSubjects = useMemo(() => {
    const subjects = questions.map(q => q.subject_name)
    return Array.from(new Set(subjects)).sort()
  }, [questions])

  const availableTopics = useMemo(() => {
    if (selectedSubject === 'all') {
      return Array.from(new Set(questions.map(q => q.topic_name))).sort()
    }
    const filtered = questions
      .filter(q => q.subject_name === selectedSubject)
      .map(q => q.topic_name)
    return Array.from(new Set(filtered)).sort()
  }, [questions, selectedSubject])

  useEffect(() => {
    setSelectedTopic('all')
    setCurrentPage(1)
  }, [selectedSubject])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedTopic, sortBy, itemsPerPage])

  const allFilteredAndSorted = useMemo(() => {
    let result = questions.filter(q => {
      const matchesSubject = selectedSubject === 'all' || q.subject_name === selectedSubject
      const matchesTopic = selectedTopic === 'all' || q.topic_name === selectedTopic
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        (q.question_text || "").toLowerCase().includes(term) ||
        q.subject_name.toLowerCase().includes(term) ||
        q.topic_name.toLowerCase().includes(term)
      return matchesSubject && matchesTopic && matchesSearch
    })

    return result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return 0
    })
  }, [questions, searchTerm, selectedSubject, selectedTopic, sortBy])

  const totalPages = Math.ceil(allFilteredAndSorted.length / itemsPerPage)

  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return allFilteredAndSorted.slice(startIndex, startIndex + itemsPerPage)
  }, [allFilteredAndSorted, currentPage, itemsPerPage])

  return (
    <div className="w-full space-y-4 font-sans text-slate-900">

      {/* --- Toolbar --- */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
          <label className="text-xs font-bold text-slate-500">แสดง:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl p-2 outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="ค้นหาโจทย์..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500">วิชา:</label>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 min-w-[120px]">
              <option value="all">ทั้งหมด</option>
              {uniqueSubjects.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500">หัวข้อ:</label>
            <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 min-w-[120px]">
              <option value="all">ทั้งหมด</option>
              {availableTopics.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><ArrowUpDown size={12} /> เรียง:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 min-w-[110px]">
              <option value="newest">ล่าสุด</option>
              <option value="oldest">เก่าสุด</option>
            </select>
          </div>
        </div>

        <Link href="/admin/questions/new">
          <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap">
            <Plus size={16} /> เพิ่มข้อสอบ
          </button>
        </Link>
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
              {paginatedQuestions.length > 0 ? (
                paginatedQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 transition-colors align-top">
                    <td className="px-6 py-5 space-y-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><BookOpen size={10} /> วิชา</span>
                        <div className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-md inline-block">{q.subject_name}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><Hash size={10} /> หัวข้อ</span>
                        <div className="text-xs font-medium text-slate-600 truncate">{q.topic_name}</div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="space-y-3">
                        {q.question_text && <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{q.question_text}</p>}
                        {q.question_image_url && (
                          <button onClick={() => setPreviewImage(q.question_image_url)} className="relative group block overflow-hidden rounded-xl border-2 border-slate-100">
                            <Image src={q.question_image_url} alt="question" width={240} height={140} className="object-cover transition-transform group-hover:scale-105" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="grid grid-cols-2 gap-2.5 w-80">
                        {Array.from({ length: 4 }).map((_, i) => {
                          const c = q.choices[i]
                          if (!c) return <div key={i} className="h-12 border border-dashed border-slate-100 rounded-xl bg-slate-50/50"></div>
                          return (
                            <div key={i} className={`p-2.5 rounded-xl border text-[11px] flex flex-col gap-1.5 shadow-sm ${c.is_correct ? 'bg-green-50 border-green-400 text-green-800' : 'bg-white border-slate-200 text-slate-600'}`}>
                              <div className="flex items-center gap-1.5 font-bold truncate">
                                {c.is_correct ? <CheckCircle2 size={14} className="text-green-600" /> : <span className="text-[10px] text-slate-300 font-black">{i + 1}.</span>}
                                <span className="truncate">{c.choice_text || (c.choice_image_url ? "ดูรูปคำตอบ" : "-")}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </td>

                    {/* 🟢 ส่วนที่แก้ไข: ปุ่มจัดการเปลี่ยนเป็นสไตล์ p-2 text-slate-400 */}
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/questions/${q.id}/edit`}>
                          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-all">
                            <Pencil size={18} />
                          </button>
                        </Link>
                        <button
                          className="p-2 text-slate-400 hover:text-red-600 transition-all"
                          onClick={() => handleDelete(q.id, q.question_image_url)}
                          disabled={isDeleting === q.id}
                        >
                          {isDeleting === q.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                    
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="px-6 py-32 text-center text-slate-400"><AlertCircle className="mx-auto mb-4 opacity-20" size={48} />ไม่พบข้อสอบที่ต้องการ</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- Pagination Footer --- */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            แสดง {paginatedQuestions.length} จากทั้งหมด {allFilteredAndSorted.length} รายการ
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page ? 'bg-slate-900 text-white' : 'hover:bg-slate-200 text-slate-600'}`}>
                  {page}
                </button>
              )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
            </div>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {previewImage && <ImageModal src={previewImage} onClose={() => setPreviewImage(null)} />}
    </div>
  )
}