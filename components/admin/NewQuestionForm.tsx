'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation' // เพิ่มไว้ redirect
import { 
  BookOpen, 
  Hash, 
  ImageIcon, 
  CheckCircle2, 
  Save, 
  PlusCircle,
  FileText,
  Type,
  AlertCircle,
  Loader2
} from 'lucide-react'

type Subject = { id: string; name: string }
type Topic = { id: string; name: string }
type Choice = {
  id?: string // เพิ่ม id ไว้ update
  type: 'text' | 'image'
  text: string
  file: File | null
}

interface Props {
  initialData?: any 
}

export default function NewQuestionForm({ initialData }: Props) {
  const router = useRouter()
  const isEdit = !!initialData?.id

  const [questionText, setQuestionText] = useState(initialData?.question_text || '')
  const [subjectId, setSubjectId] = useState(initialData?.subject_id || '')
  const [topicId, setTopicId] = useState(initialData?.topic_id || '')

  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [questionType, setQuestionType] = useState<'text' | 'image'>(initialData?.question_type || 'text')
  
  const [questionImage, setQuestionImage] = useState<File | null>(null)
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  
  const [choices, setChoices] = useState<Choice[]>([
    { type: 'text', text: '', file: null },
    { type: 'text', text: '', file: null },
    { type: 'text', text: '', file: null },
    { type: 'text', text: '', file: null },
  ])

  // 🟡 Sync ข้อมูลเมื่อ initialData เปลี่ยนแปลง (ใช้โครงสร้างเดิมของคุณ)
  useEffect(() => {
    if (initialData) {
      setQuestionText(initialData.question_text || '')
      setSubjectId(initialData.subject_id || '')
      setTopicId(initialData.topic_id || '')
      setQuestionType(initialData.question_type || 'text')

      if (initialData.choices && initialData.choices.length > 0) {
        const sortedChoices = [...initialData.choices].sort((a, b) => (a.id || '').localeCompare(b.id || ''))
        const mapped = sortedChoices.map((c: any, index: number) => {
          if (c.is_correct) setCorrectIndex(index)
          return {
            id: c.id,
            type: c.choice_type || 'text',
            text: c.choice_text || '',
            file: null
          }
        })
        setChoices(mapped)
      }
    }
  }, [initialData])

  useEffect(() => {
    supabase.from('subjects').select('id,name').then(({ data }) => setSubjects(data || []))
  }, [])

  useEffect(() => {
    const fetchTopics = async () => {
      if (!subjectId) { setTopics([]); setTopicId(''); return }
      const { data } = await supabase.from('topics').select('id,name').eq('subject_id', subjectId)
      setTopics(data || [])
      
      // ถ้าเป็นโหมด Edit ให้ล็อคค่า topicId เดิมไว้ไม่ให้หาย
      if (isEdit && initialData?.topic_id && subjectId === initialData.subject_id) {
        setTopicId(initialData.topic_id)
      }
    }
    fetchTopics()
  }, [subjectId, initialData])

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
      }

      let currentQuestionId = initialData?.id

      if (isEdit) {
        const { error } = await supabase.from('questions').update(questionPayload).eq('id', currentQuestionId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('questions').insert(questionPayload).select().single()
        if (error) throw error
        currentQuestionId = data.id
      }

      // จัดการ Choices
      for (let i = 0; i < choices.length; i++) {
        const c = choices[i]
        const choicePayload = {
          question_id: currentQuestionId,
          choice_text: c.type === 'text' ? c.text : null,
          choice_type: c.type,
          is_correct: i === correctIndex,
        }

        if (isEdit && c.id) {
          await supabase.from('choices').update(choicePayload).eq('id', c.id)
        } else {
          await supabase.from('choices').insert(choicePayload)
        }
      }

      alert(isEdit ? 'แก้ไขสำเร็จ 🎉' : 'เพิ่มข้อสอบสำเร็จ 🎉')
      if (!isEdit) {
         setQuestionText(''); setQuestionImage(null); setCorrectIndex(null)
         setChoices([{ type: 'text', text: '', file: null }, { type: 'text', text: '', file: null }, { type: 'text', text: '', file: null }, { type: 'text', text: '', file: null }])
      } else {
        router.push('/admin/questions')
        router.refresh()
      }
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาด')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 font-sans text-slate-900">
      
      {/* --- Header --- */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-100">
          <PlusCircle size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{isEdit ? 'แก้ไขข้อสอบ' : 'เพิ่มข้อสอบใหม่'}</h1>
          <p className="text-sm text-slate-500 font-medium">กรอกโจทย์และตัวเลือกให้ครบถ้วนก่อนบันทึก</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* --- Left Sidebar --- */}
        <div className="md:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2">
              <BookOpen size={14} /> การจัดหมวดหมู่
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 ml-1">วิชา</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none"
                  value={subjectId} 
                  onChange={(e) => setSubjectId(e.target.value)}
                >
                  <option value="">-- เลือกวิชา --</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 ml-1">หัวข้อ (Topic)</label>
                <select 
                  disabled={!subjectId}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-50 appearance-none"
                  value={topicId} 
                  onChange={(e) => setTopicId(e.target.value)}
                >
                  <option value="">-- เลือกหัวข้อ --</option>
                  {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* --- Main Content --- */}
        <div className="md:col-span-2 space-y-8">
          
          <section className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm space-y-6">
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
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm outline-none h-[180px] resize-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  placeholder="ระบุคำถามที่คุณต้องการทดสอบ..."
                  value={questionText || ''}
                  onChange={(e) => setQuestionText(e.target.value)}
                />
              ) : (
                <div className="group relative border-2 border-dashed border-slate-200 rounded-[24px] h-[180px] flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100/50 transition-all cursor-pointer">
                  <div className="p-4 bg-white rounded-full shadow-sm text-blue-500 group-hover:scale-110 transition-transform">
                    <ImageIcon size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">คลิกเพื่ออัปโหลดรูปโจทย์</p>
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && setQuestionImage(e.target.files[0])} />
                  </div>
                  {(questionImage || initialData?.question_image_url) && <div className="mt-2 px-4 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full">✅ มีรูปภาพแล้ว</div>}
                </div>
              )}
            </div>
          </section>

          {/* Section: Choices */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 px-2 flex items-center gap-2">
              <Type size={16} /> ตัวเลือกคำตอบ (4 ตัวเลือก)
            </h3>
            
            <div className="grid grid-cols-1 gap-5">
              {choices.map((c, i) => (
                <div key={i} className={`relative bg-white border rounded-[24px] p-6 transition-all shadow-sm ${correctIndex === i ? 'border-green-500 ring-4 ring-green-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex flex-row sm:flex-col gap-3 shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">{String.fromCharCode(65 + i)}</div>
                      <button 
                        type="button"
                        onClick={() => setCorrectIndex(i)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${correctIndex === i ? 'bg-green-500 border-green-500 text-white' : 'bg-white text-slate-400'}`}
                      >
                        {correctIndex === i ? 'CORRECT' : 'SET TRUE'}
                      </button>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex gap-2">
                        <Button type="button" variant={c.type === 'text' ? 'secondary' : 'outline'} onClick={() => switchChoiceType(i, 'text')} className="text-[10px] font-black px-4 h-8">TEXT</Button>
                        <Button type="button" variant={c.type === 'image' ? 'secondary' : 'outline'} onClick={() => switchChoiceType(i, 'image')} className="text-[10px] font-black px-4 h-8">IMAGE</Button>
                      </div>
                      {c.type === 'text' ? (
                        <input
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                          placeholder="พิมพ์ข้อความคำตอบ..."
                          value={c.text || ''}
                          onChange={(e) => {
                            const next = [...choices]; next[i].text = e.target.value; setChoices(next)
                          }}
                        />
                      ) : (
                        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3">
                          <ImageIcon size={20} className="text-slate-400" />
                          <input type="file" accept="image/*" className="text-xs text-slate-500" 
                            onChange={(e) => {
                              const next = [...choices]; next[i].file = e.target.files?.[0] || null; setChoices(next)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {correctIndex === i && <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-1 border-4 border-white shadow-lg"><CheckCircle2 size={20} /></div>}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white py-5 rounded-[24px] text-sm font-black shadow-2xl transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อสอบลงคลัง'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}