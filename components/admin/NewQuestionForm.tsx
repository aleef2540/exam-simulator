'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation' 
import { 
  BookOpen, 
  ImageIcon, 
  CheckCircle2, 
  Save, 
  PlusCircle,
  FileText,
  Type,
  Loader2,
  Lock,
  Shuffle,
  Layers,
  Plus,
  AlertCircle
} from 'lucide-react'

type Subject = { id: string; name: string }
type Topic = { id: string; name: string }
type Choice = {
  id?: string 
  type: 'text' | 'image'
  text: string
  file: File | null
  sort_order: number | null
}

interface Props {
  initialData?: any 
}

export default function NewQuestionForm({ initialData }: Props) {
  const router = useRouter()
  const isEdit = !!initialData?.id

  // --- States ---
  const [questionText, setQuestionText] = useState(initialData?.question_text || '')
  const [subjectId, setSubjectId] = useState(initialData?.subject_id || '')
  const [topicId, setTopicId] = useState(initialData?.topic_id || '')
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [questionType, setQuestionType] = useState<'text' | 'image'>(initialData?.question_type || 'text')
  const [questionImage, setQuestionImage] = useState<File | null>(null)
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const [isFixedOrder, setIsFixedOrder] = useState(false)

  const [groupId, setGroupId] = useState(initialData?.group_id || '')
  const [groupOrder, setGroupOrder] = useState<string>(initialData?.group_order?.toString() || '')
  const [existingGroups, setExistingGroups] = useState<string[]>([])
  const [orderError, setOrderError] = useState<string | null>(null)

  const [choices, setChoices] = useState<Choice[]>([
    { type: 'text', text: '', file: null, sort_order: null },
    { type: 'text', text: '', file: null, sort_order: null },
    { type: 'text', text: '', file: null, sort_order: null },
    { type: 'text', text: '', file: null, sort_order: null },
  ])

  // --- Effects ---
  useEffect(() => {
    supabase.from('subjects').select('id,name').then(({ data }) => setSubjects(data || []))
    fetchExistingGroups()
  }, [])

  const fetchExistingGroups = async () => {
    const { data } = await supabase.from('questions').select('group_id').not('group_id', 'is', null)
    if (data) {
      const uniqueGroups = Array.from(new Set(data.map(item => item.group_id)))
      setExistingGroups(uniqueGroups as string[])
    }
  }

  // 🟢 แก้ไขการดึงข้อมูล: เรียงลำดับตาม sort_order หรือ ID ให้คงที่
  useEffect(() => {
    if (initialData) {
      setQuestionText(initialData.question_text || '')
      setSubjectId(initialData.subject_id || '')
      setTopicId(initialData.topic_id || '')
      setQuestionType(initialData.question_type || 'text')
      setGroupId(initialData.group_id || '')
      setGroupOrder(initialData.group_order?.toString() || '')

      if (initialData.choices && initialData.choices.length > 0) {
        const hasFixed = initialData.choices.some((c: any) => c.sort_order !== null)
        setIsFixedOrder(hasFixed)

        // เรียงลำดับเพื่อให้ A, B, C, D แสดงผลถูกต้องในหน้า Edit
        const sortedChoices = [...initialData.choices].sort((a, b) => {
          if (hasFixed) {
            return (a.sort_order || 0) - (b.sort_order || 0)
          }
          return (a.id || '').localeCompare(b.id || '')
        })

        const mapped = sortedChoices.map((c: any, index: number) => {
          if (c.is_correct) setCorrectIndex(index)
          return {
            id: c.id,
            type: c.choice_type || 'text',
            text: c.choice_text || '',
            file: null,
            sort_order: c.sort_order ?? null
          }
        })
        setChoices(mapped)
      }
    }
  }, [initialData])

  useEffect(() => {
    const fetchTopics = async () => {
      if (!subjectId) { setTopics([]); setTopicId(''); return }
      const { data } = await supabase.from('topics').select('id,name').eq('subject_id', subjectId)
      setTopics(data || [])
    }
    fetchTopics()
  }, [subjectId])

  const checkOrderDuplicate = async (gId: string, gOrder: string) => {
    if (!gId || !gOrder) { setOrderError(null); return false }
    const { data } = await supabase.from('questions').select('id').eq('group_id', gId).eq('group_order', parseInt(gOrder)).maybeSingle()
    if (data && (!isEdit || data.id !== initialData?.id)) {
      setOrderError(`ลำดับที่ ${gOrder} ถูกใช้ไปแล้วในกลุ่มนี้`)
      return true
    } else {
      setOrderError(null)
      return false
    }
  }

  const switchChoiceType = (i: number, type: 'text' | 'image') => {
    setChoices((prev) => prev.map((c, idx) => idx === i ? { ...c, type, text: '', file: null } : c))
  }

  const uploadQuestionImage = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `questions/${fileName}`
    const { error } = await supabase.storage.from('question-images').upload(filePath, file)
    if (error) throw error
    const { data } = supabase.storage.from('question-images').getPublicUrl(filePath)
    return data.publicUrl
  }

  const submit = async () => {
    if (!subjectId || !topicId) return alert('กรุณาเลือกวิชาและหมวด')
    if (!questionText && !questionImage && questionType === 'text') return alert('กรุณากรอกโจทย์')
    if (correctIndex === null) return alert('กรุณาเลือกคำตอบที่ถูก')

    if (groupId && groupOrder) {
      const isDuplicate = await checkOrderDuplicate(groupId, groupOrder)
      if (isDuplicate) return alert('ไม่สามารถบันทึกได้เนื่องจากลำดับในกลุ่มซ้ำกัน')
    }

    setLoading(true)
    try {
      let imageUrl = initialData?.question_image_url || null
      if (questionType === 'image' && questionImage) imageUrl = await uploadQuestionImage(questionImage)

      const questionPayload = {
        subject_id: subjectId,
        topic_id: topicId,
        question_text: questionType === 'text' ? questionText : null,
        question_type: questionType,
        question_image_url: imageUrl,
        group_id: groupId || null,
        group_order: groupOrder ? parseInt(groupOrder) : null
      }

      let currentQuestionId = initialData?.id
      if (isEdit) {
        await supabase.from('questions').update(questionPayload).eq('id', currentQuestionId)
      } else {
        const { data, error } = await supabase.from('questions').insert(questionPayload).select().single()
        if (error) throw error
        currentQuestionId = data.id
      }

      for (let i = 0; i < choices.length; i++) {
        const c = choices[i]
        const choicePayload = {
          question_id: currentQuestionId,
          choice_text: c.type === 'text' ? c.text : null,
          choice_type: c.type,
          is_correct: i === correctIndex,
          sort_order: isFixedOrder ? (i + 1) : null 
        }

        if (isEdit && c.id) {
          await supabase.from('choices').update(choicePayload).eq('id', c.id)
        } else {
          await supabase.from('choices').insert(choicePayload)
        }
      }

      alert(isEdit ? 'แก้ไขสำเร็จ 🎉' : 'เพิ่มข้อสอบสำเร็จ 🎉')
      if (!isEdit) {
          setQuestionText(''); setQuestionImage(null); setCorrectIndex(null); setIsFixedOrder(false)
          setGroupId(''); setGroupOrder(''); setOrderError(null);
          setChoices([{ type: 'text', text: '', file: null, sort_order: null }, { type: 'text', text: '', file: null, sort_order: null }, { type: 'text', text: '', file: null, sort_order: null }, { type: 'text', text: '', file: null, sort_order: null }])
          fetchExistingGroups();
          router.refresh();
      } else {
        router.push('/admin/questions'); router.refresh()
      }
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาด')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 font-sans text-slate-900">
      
      <div className="flex items-center gap-4 border-b border-slate-300 pb-6">
        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-100"><PlusCircle size={28} /></div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{isEdit ? 'แก้ไขข้อสอบ' : 'เพิ่มข้อสอบใหม่'}</h1>
          <p className="text-sm text-slate-500 font-medium">จัดการโจทย์และระบบลำดับกลุ่มข้อสอบ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-[24px] border border-slate-300 shadow-sm space-y-5">
            <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2">
              <BookOpen size={14} /> การจัดหมวดหมู่
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 ml-1">วิชา</label>
                <select className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                  <option value="">-- เลือกวิชา --</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 ml-1">หัวข้อ (Topic)</label>
                <select disabled={!subjectId} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-50 appearance-none cursor-pointer" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
                  <option value="">-- เลือกหัวข้อ --</option>
                  {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[24px] border border-slate-300 shadow-sm space-y-5">
            <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2">
              <Layers size={14} /> การจัดกลุ่มข้อสอบชุด
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 ml-1">รหัสกลุ่ม (Group ID)</label>
                <input list="existing-groups-list" type="text" placeholder="พิมพ์ชื่อกลุ่ม..." className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" value={groupId} onChange={(e) => { setGroupId(e.target.value); checkOrderDuplicate(e.target.value, groupOrder) }} />
                <datalist id="existing-groups-list">{existingGroups.map((g) => <option key={g} value={g} />)}</datalist>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 ml-1">ลำดับในกลุ่ม (Order)</label>
                <input type="number" placeholder="เช่น 1, 2..." className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none ${orderError ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-blue-500/20'}`} value={groupOrder} onChange={(e) => { setGroupOrder(e.target.value); checkOrderDuplicate(groupId, e.target.value) }} />
                {orderError && <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold ml-1 animate-pulse"><AlertCircle size={10} /> {orderError}</div>}
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[24px] border border-slate-300 shadow-sm space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">การตั้งค่าตัวเลือก</h3>
            <div onClick={() => setIsFixedOrder(!isFixedOrder)} className={`group flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${isFixedOrder ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-300 hover:border-slate-400'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-all ${isFixedOrder ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-500'}`}>{isFixedOrder ? <Lock size={16} /> : <Shuffle size={16} />}</div>
                <span className={`text-[11px] font-black ${isFixedOrder ? 'text-indigo-900' : 'text-slate-500'}`}>{isFixedOrder ? 'Fixed Order' : 'Random order'}</span>
              </div>
              <div className={`w-11 h-6 rounded-full relative transition-all ${isFixedOrder ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isFixedOrder ? 'left-6' : 'left-1'}`} />
              </div>
            </div>
          </section>
        </div>

        <div className="md:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-[24px] border border-slate-300 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2">
                <FileText size={16} /> เนื้อหาโจทย์
              </h3>
              <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1">
                <button type="button" onClick={() => setQuestionType('text')} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${questionType === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>TEXT</button>
                <button type="button" onClick={() => setQuestionType('image')} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${questionType === 'image' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>IMAGE</button>
              </div>
            </div>
            <div className="min-h-[180px]">
              {questionType === 'text' ? (
                <textarea className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-5 text-sm outline-none h-[180px] resize-none focus:ring-4 focus:ring-blue-500/5 transition-all" placeholder="ระบุคำถาม..." value={questionText || ''} onChange={(e) => setQuestionText(e.target.value)} />
              ) : (
                <div className="group relative border-2 border-dashed border-slate-300 rounded-[24px] h-[180px] flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100/50 cursor-pointer">
                  <div className="p-4 bg-white rounded-full shadow-sm text-blue-500"><ImageIcon size={32} /></div>
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && setQuestionImage(e.target.files[0])} />
                  {(questionImage || initialData?.question_image_url) && <div className="mt-2 px-4 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full">✅ มีรูปภาพแล้ว</div>}
                </div>
              )}
            </div>
          </section>

          <div className="space-y-4">
            {choices.map((c, i) => (
              <div key={i} className={`relative bg-white border rounded-[24px] p-6 transition-all shadow-sm ${correctIndex === i ? 'border-green-500 ring-4 ring-green-50' : 'border-slate-300 hover:border-slate-400'}`}>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex flex-row sm:flex-col gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">{String.fromCharCode(65 + i)}</div>
                    <button type="button" onClick={() => setCorrectIndex(i)} className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${correctIndex === i ? 'bg-green-500 border-green-500 text-white' : 'bg-white text-slate-400 border-slate-300'}`}>
                      {correctIndex === i ? 'CORRECT' : 'SET TRUE'}
                    </button>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex gap-2">
                      <Button type="button" variant={c.type === 'text' ? 'secondary' : 'outline'} onClick={() => switchChoiceType(i, 'text')} className="text-[10px] font-black px-4 h-8">TEXT</Button>
                      <Button type="button" variant={c.type === 'image' ? 'secondary' : 'outline'} onClick={() => switchChoiceType(i, 'image')} className="text-[10px] font-black px-4 h-8">IMAGE</Button>
                    </div>
                    {c.type === 'text' ? (
                      <input className="w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-3 text-sm outline-none transition-all focus:border-blue-400" placeholder="คำตอบ..." value={c.text || ''} onChange={(e) => { const next = [...choices]; next[i].text = e.target.value; setChoices(next) }} />
                    ) : (
                      <div className="flex items-center gap-4 bg-slate-50 border border-slate-300 rounded-xl px-5 py-3 transition-all focus-within:border-blue-400">
                        <ImageIcon size={20} className="text-slate-400" />
                        <input type="file" accept="image/*" className="text-xs text-slate-500" onChange={(e) => { const next = [...choices]; next[i].file = e.target.files?.[0] || null; setChoices(next) }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={submit} disabled={loading || !!orderError} className={`w-full flex items-center justify-center gap-3 py-5 rounded-[24px] text-sm font-black shadow-2xl transition-all ${loading || !!orderError ? 'bg-slate-200 cursor-not-allowed text-slate-400' : 'bg-slate-900 hover:bg-slate-800 text-white hover:-translate-y-1'}`}>
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อสอบลงคลัง'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}