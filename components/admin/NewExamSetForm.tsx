'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { 
  Library, Save, LayoutList, Hash, GripVertical, Trash2, Info, Clock, Plus 
} from 'lucide-react'
import { useRouter } from 'next/navigation' 

// --- DND Kit Imports ---
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Topic = { id: string; name: string }
type SelectedTopic = { topicId: string; count: number }

function SortableItem({ topic, selectedIdx, count, onUpdateCount, onRemove }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: topic.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  }
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`flex items-center gap-4 p-4 rounded-[20px] transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-100 mb-2 ${isDragging ? 'opacity-50 scale-105 shadow-2xl' : ''}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/20 rounded">
        <GripVertical size={20} className="text-white/70" />
      </div>
      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-black text-sm">{selectedIdx + 1}</div>
      <span className="flex-1 text-sm font-bold truncate">{topic?.name || 'กำลังโหลด...'}</span>
      <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
        <input
          type="number"
          className="w-10 bg-transparent text-center font-black text-white text-sm outline-none"
          value={count}
          onChange={(e) => onUpdateCount(topic.id, e.target.value)}
        />
        <span className="text-[10px] font-black text-white/60 uppercase">ข้อ</span>
      </div>
      <button onClick={() => onRemove(topic.id)} className="p-2 hover:bg-red-500 rounded-lg transition-colors">
        <Trash2 size={16} />
      </button>
    </div>
  )
}

interface Props {
  initialData?: any 
}

export default function NewExamSetForm({ initialData }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [duration, setDuration] = useState<number>(initialData?.duration || 60)
  const [status, setStatus] = useState(initialData?.status || 'draft')
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured || false)

  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopics, setSelectedTopics] = useState<SelectedTopic[]>(
    initialData?.exam_set_topics?.map((t: any) => ({
      topicId: t.topic_id,
      count: t.question_count
    })) || []
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    supabase.from('topics').select('id,name').order('name').then(({ data }) => setTopics(data || []))
  }, [])

  const totalQuestions = selectedTopics.reduce((sum, t) => sum + (t.count || 0), 0)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setSelectedTopics((items) => {
        const oldIndex = items.findIndex((t) => t.topicId === active.id)
        const newIndex = items.findIndex((t) => t.topicId === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const toggleTopic = (topicId: string) => {
    if (selectedTopics.find(t => t.topicId === topicId)) {
      setSelectedTopics(prev => prev.filter(t => t.topicId !== topicId))
    } else {
      setSelectedTopics(prev => [...prev, { topicId, count: 10 }])
    }
  }

  const updateCount = (topicId: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value)
    setSelectedTopics(prev => prev.map(t => t.topicId === topicId ? { ...t, count: numValue } : t))
  }

  const submit = async () => {
    if (!name.trim() || selectedTopics.length === 0 || duration <= 0) return alert('กรุณากรอกข้อมูลให้ครบถ้วน')
    setLoading(true)
    
    try {
      let examSetId = initialData?.id
      const examData = { name, description, duration, status, is_featured: isFeatured }

      if (examSetId) {
        const { error: updateError } = await supabase.from('exam_sets').update(examData).eq('id', examSetId)
        if (updateError) throw updateError
        await supabase.from('exam_set_topics').delete().eq('exam_set_id', examSetId)
      } else {
        const { data: newExam, error: insertError } = await supabase.from('exam_sets').insert(examData).select().single()
        if (insertError) throw insertError
        examSetId = newExam.id
      }

      const payload = selectedTopics.map((t, index) => ({
        exam_set_id: examSetId,
        topic_id: t.topicId,
        question_count: t.count,
        sort_order: index + 1
      }))

      const { error: relError } = await supabase.from('exam_set_topics').insert(payload)
      if (relError) throw relError

      alert(initialData?.id ? 'แก้ไขข้อมูลสำเร็จ ✨' : 'บันทึกสำเร็จ 🎉')
      router.push('/admin/exam-sets')
      router.refresh()
    } catch (err: any) { 
      alert('ผิดพลาด: ' + err.message) 
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 text-slate-900 font-sans">
      <div className="flex items-center gap-4 border-b pb-6 text-slate-900">
        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
          <Library size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black">{initialData?.id ? 'แก้ไขชุดข้อสอบ' : 'จัดชุดข้อสอบใหม่'}</h1>
          <p className="text-sm text-slate-500 font-medium">กำหนดเวลาและสัดส่วนของแต่ละหัวข้อ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">ชื่อชุดข้อสอบ</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-colors" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">สถานะการใช้งาน</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-colors cursor-pointer" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="draft">📁 ร่าง (Draft)</option>
                <option value="published">🚀 เปิดใช้งาน (Published)</option>
                <option value="archived">📦 ปิดใช้งาน (Archived)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 px-2 py-1">
              <input type="checkbox" id="isFeatured" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
              <label htmlFor="isFeatured" className="text-xs font-black uppercase text-slate-500 cursor-pointer select-none">แนะนำเป็นพิเศษ</label>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">เวลาที่ใช้สอบ (นาที)</label>
              <div className="relative">
                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-black outline-none focus:border-indigo-500 transition-colors" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 0)} />
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">รายละเอียด</label>
              <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none min-h-[100px] resize-none focus:border-indigo-500 transition-colors" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black mb-4 flex items-center gap-2 text-slate-400 uppercase tracking-widest"><LayoutList size={18}/> หัวข้อที่เลือก</h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={selectedTopics.map(t => t.topicId)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1 mb-6">
                  {selectedTopics.map((st, idx) => {
                    const topic = topics.find(t => t.id === st.topicId)
                    return (
                      <SortableItem key={st.topicId} topic={topic || { id: st.topicId, name: 'กำลังโหลด...' }} selectedIdx={idx} count={st.count} onUpdateCount={updateCount} onRemove={toggleTopic} />
                    )
                  })}
                  {selectedTopics.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[28px] text-slate-400 text-sm font-bold italic">ยังไม่มีหัวข้อที่เลือก</div>
                  )}
                </div>
              </SortableContext>
            </DndContext>

            <h3 className="text-sm font-black mb-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-slate-400 uppercase tracking-widest">เพิ่มหัวข้ออื่น</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-1">
              {topics.filter(t => !selectedTopics.find(st => st.topicId === t.id)).map(topic => (
                <div key={topic.id} onClick={() => toggleTopic(topic.id)} className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-xl cursor-pointer text-xs font-black text-slate-600 transition-all flex items-center justify-between group">
                  <span className="truncate">{topic.name}</span>
                  <Plus size={14} className="text-slate-300 group-hover:text-indigo-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[32px] p-6 flex items-center justify-between shadow-2xl">
            <div className="flex gap-8">
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg"><Hash size={20}/></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase">รวมข้อสอบ</p><p className="text-xl font-black">{totalQuestions} ข้อ</p></div>
              </div>
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg"><Clock size={20}/></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase">เวลาทั้งหมด</p><p className="text-xl font-black">{duration} น.</p></div>
              </div>
            </div>
            
            <div className="flex gap-3">
              {initialData?.id && (
                <Button type="button" onClick={() => router.back()} className="px-6 py-4 rounded-2xl bg-white/10 text-white font-black hover:bg-white/20 border-0 shadow-none min-w-[100px]">
                  ยกเลิก
                </Button>
              )}
              <Button onClick={submit} disabled={loading} className="px-8 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 font-black text-white shadow-xl shadow-indigo-500/20 min-w-[160px]">
                {loading ? 'บันทึก...' : <><Save size={18} className="mr-2 inline" /> {initialData?.id ? 'บันทึกการแก้ไข' : 'สร้างชุดข้อสอบ'}</>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}