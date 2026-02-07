'use client'

import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import ImageModal from '@/components/ui/ImageModal'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Pencil,
  Trash2,
  Search,
  Plus,
  BookOpen,
  Hash,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Shuffle,
  AlertCircle,
  CheckCircle2,
  Layers
} from 'lucide-react'

type Question = {
  id: string
  question_text: string | null
  question_image_url: string | null
  subject_name: string
  topic_name: string
  created_at: string
  group_id: string | null
  group_order: number | null
  choices: {
    id: string
    choice_text: string | null
    choice_image_url: string | null
    is_correct: boolean
    sort_order?: number | null
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
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อสอบข้อนี้?')) return
    setIsDeleting(questionId)
    try {
      await supabase.from('choices').delete().eq('question_id', questionId)
      if (imageUrl) {
        const filePath = imageUrl.split('/').pop()
        if (filePath) await supabase.storage.from('question-images').remove([`questions/${filePath}`])
      }
      await supabase.from('questions').delete().eq('id', questionId)
      alert('ลบข้อสอบสำเร็จ')
      router.refresh()
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } finally {
      setIsDeleting(null)
    }
  }

  const uniqueSubjects = useMemo(() => Array.from(new Set(questions.map(q => q.subject_name))).sort(), [questions])
  const availableTopics = useMemo(() => {
    const filtered = selectedSubject === 'all' ? questions : questions.filter(q => q.subject_name === selectedSubject)
    return Array.from(new Set(filtered.map(q => q.topic_name))).sort()
  }, [questions, selectedSubject])

  useEffect(() => { setSelectedTopic('all'); setCurrentPage(1); }, [selectedSubject])
  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedTopic, sortBy, itemsPerPage])

  const allFilteredAndSorted = useMemo(() => {
    let result = questions.filter(q => {
      const matchesSubject = selectedSubject === 'all' || q.subject_name === selectedSubject
      const matchesTopic = selectedTopic === 'all' || q.topic_name === selectedTopic
      const term = searchTerm.toLowerCase()
      return matchesSubject && matchesTopic && (
        (q.question_text || "").toLowerCase().includes(term) ||
        (q.group_id || "").toLowerCase().includes(term) ||
        q.subject_name.toLowerCase().includes(term) ||
        q.topic_name.toLowerCase().includes(term)
      )
    })

    return result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'group') {
        const groupA = a.group_id || 'zzzz'; const groupB = b.group_id || 'zzzz'
        if (groupA !== groupB) return groupA.localeCompare(groupB)
        return (a.group_order || 0) - (b.group_order || 0)
      }
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
      
      {/* Toolbar - ปรับขอบเข้มขึ้น */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-300 shadow-sm">
        <div className="flex items-center gap-2 border-r border-slate-300 pr-4">
          <label className="text-xs font-bold text-slate-500">แสดง:</label>
          <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="bg-slate-50 border border-slate-300 text-xs font-bold rounded-xl p-2 outline-none cursor-pointer">
            <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
          </select>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="ค้นหาโจทย์..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="bg-slate-50 border border-slate-300 text-xs rounded-lg p-2 min-w-[120px] cursor-pointer font-medium">
            <option value="all">ทุกวิชา</option>
            {uniqueSubjects.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} className="bg-slate-50 border border-slate-300 text-xs rounded-lg p-2 min-w-[120px] cursor-pointer font-medium">
            <option value="all">ทุกหัวข้อ</option>
            {availableTopics.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-slate-50 border border-slate-300 text-xs rounded-lg p-2 min-w-[110px] cursor-pointer font-medium">
            <option value="newest">ล่าสุด</option><option value="oldest">เก่าสุด</option><option value="group">เรียงตามกลุ่ม</option>
          </select>
        </div>
        <Link href="/admin/questions/new">
          <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={16} /> เพิ่มข้อสอบ
          </button>
        </Link>
      </div>

      {/* Table Section - ปรับเส้นตารางเข้มขัดเจน (slate-300) */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-700 uppercase tracking-widest">
                <th className="px-6 py-4 w-60">ข้อมูลพื้นฐาน / กลุ่ม</th>
                <th className="px-6 py-4 border-l border-slate-300">เนื้อหาโจทย์</th>
                <th className="px-6 py-4 border-l border-slate-300">ตัวเลือกคำตอบ</th>
                <th className="px-6 py-4 border-l border-slate-300 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {paginatedQuestions.length > 0 ? (
                paginatedQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors align-top">
                    <td className="px-6 py-5 space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><BookOpen size={10} /> วิชา</span>
                        <div className="text-xs font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2 py-1 rounded-md inline-block">{q.subject_name}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Hash size={10} /> หัวข้อ</span>
                        <div className="text-xs font-bold text-slate-700 truncate">{q.topic_name}</div>
                      </div>
                      {q.group_id && (
                        <div className="space-y-1 pt-2 border-t border-slate-300">
                          <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1"><Layers size={10} /> ชุดข้อสอบ (กลุ่ม)</span>
                          <div className="text-[11px] font-black text-indigo-800 bg-indigo-100 border border-indigo-300 px-2 py-1 rounded-md inline-block">ID: {q.group_id}</div>
                          <div className="text-[10px] font-bold text-slate-500 ml-1">ลำดับ: {q.group_order || '-'}</div>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-5 border-l border-slate-300">
                      <div className="space-y-3">
                        {q.question_text && <p className="text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">{q.question_text}</p>}
                        {q.question_image_url && (
                          <button onClick={() => setPreviewImage(q.question_image_url)} className="relative block overflow-hidden rounded-xl border-2 border-slate-300 group">
                            <Image src={q.question_image_url} alt="question" width={240} height={140} className="object-cover transition-transform group-hover:scale-105" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-5 border-l border-slate-300">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          {q.choices.some(c => Number(c.sort_order) > 0) ? (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 border border-indigo-300 rounded-md text-[9px] font-black text-indigo-700 uppercase"><Lock size={10} /> Fixed Order</div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-md text-[9px] font-black text-slate-500 uppercase"><Shuffle size={10} /> Random</div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 w-80">
                          {/* ส่วนเรียงลำดับช้อยส์: เรียงตาม sort_order ก่อน ถ้าไม่มีให้เรียงตาม ID */}
                          {[...q.choices]
                            .sort((a, b) => {
                                if (a.sort_order !== null && b.sort_order !== null) {
                                    return (a.sort_order || 0) - (b.sort_order || 0);
                                }
                                return (a.id || '').localeCompare(b.id || '');
                            })
                            .map((c, i) => {
                            if (!c) return <div key={i} className="h-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50"></div>
                            return (
                              <div key={c.id || i} className={`p-2.5 rounded-xl border text-[11px] flex flex-col gap-1.5 shadow-sm transition-all ${c.is_correct ? 'bg-green-100 border-green-500 text-green-900 ring-1 ring-green-200' : 'bg-white border-slate-300 text-slate-700'}`}>
                                <div className="flex items-center gap-1.5 font-bold truncate">
                                  {c.is_correct ? <CheckCircle2 size={14} className="text-green-700" /> : <span className="text-[10px] text-slate-400 font-black">{i + 1}.</span>}
                                  <span className="truncate">{c.choice_text || (c.choice_image_url ? "ดูรูปคำตอบ" : "-")}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 border-l border-slate-300 text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/questions/${q.id}/edit`}>
                          <button className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Pencil size={18} /></button>
                        </Link>
                        <button className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" onClick={() => handleDelete(q.id, q.question_image_url)} disabled={isDeleting === q.id}>
                          {isDeleting === q.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-32 text-center text-slate-400">
                    <AlertCircle className="mx-auto mb-4 opacity-30" size={48} />
                    <p className="font-bold">ไม่พบข้อสอบที่ต้องการ</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer - ปรับเส้นเข้ม */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-300 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">ทั้งหมด {allFilteredAndSorted.length} รายการ</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-200 disabled:opacity-30 transition-all shadow-sm"><ChevronLeft size={18} /></button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === page ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'}`}>{page}</button>
              )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
            </div>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-200 disabled:opacity-30 transition-all shadow-sm"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
      {previewImage && <ImageModal src={previewImage} onClose={() => setPreviewImage(null)} />}
    </div>
  )
}