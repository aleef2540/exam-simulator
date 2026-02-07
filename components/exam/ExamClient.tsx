'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client' // ใช้ชื่อตามที่คุณมี
import Timer from './Timer'
import QuestionCard from './QuestionCard'
import QuestionNavigator from './QuestionNavigator'

type Choice = {
  id: string
  choice_text: string | null
}

type Question = {
  id: string
  question_text: string
  question_type: 'text' | 'image'
  image_url?: string | null
  topic_id: string    // เพิ่มเพื่อเก็บคะแนนแยกหมวด
  topic_name: string  // เพิ่มเพื่อเก็บคะแนนแยกหมวด
  choices: Choice[]
}

export default function ExamClient({
  questions: initialQuestions, // รับมาเป็น initial
  title,
  duration,
  examSetId, // รับเพิ่ม
  userId,    // รับเพิ่ม
}: {
  questions: Question[]
  title?: string
  duration?: number
  examSetId: string
  userId: string
}) {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([]) // เก็บคำถามที่สุ่มแล้ว
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeUsed, setTimeUsed] = useState<Record<string, number>>({})
  const [questionStart, setQuestionStart] = useState(Date.now())

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const currentQuestion = questions[current]
  const startedAt = useRef<string>(new Date().toISOString())
  const examDuration = (duration || 60) * 60

  // --- 1. จัดการเรื่อง Shuffle และการ Refresh (ใช้ LocalStorage) ---
  useEffect(() => {
    const storageKey = `exam_cache_${examSetId}_${userId}`
    const saved = localStorage.getItem(storageKey)

    if (saved) {
      const parsed = JSON.parse(saved)
      setQuestions(parsed.questions)
      setAnswers(parsed.answers)
    } else {
      // สุ่มช้อยส์ครั้งแรกครั้งเดียว
      const shuffled = [...initialQuestions].map(q => ({
        ...q,
        choices: [...q.choices].sort(() => Math.random() - 0.5)
      }))
      setQuestions(shuffled)
    }
    setIsInitialized(true)
  }, [examSetId, userId, initialQuestions])

  // Save ลง LocalStorage ทุกครั้งที่คำตอบเปลี่ยน
  useEffect(() => {
    if (isInitialized && questions.length > 0) {
      const storageKey = `exam_cache_${examSetId}_${userId}`
      localStorage.setItem(storageKey, JSON.stringify({ questions, answers }))
    }
  }, [answers, questions, isInitialized, examSetId, userId])

  const handleTimeUp = () => {
    alert('หมดเวลาแล้ว! ระบบกำลังส่งคำตอบอัตโนมัติ')
    handleSubmit(true)
  }

  const recordTime = () => {
    if (!currentQuestion) return
    const now = Date.now()
    const spent = Math.floor((now - questionStart) / 1000)
    setTimeUsed((prev) => ({
      ...prev,
      [currentQuestion.id]: (prev[currentQuestion.id] || 0) + spent,
    }))
    setQuestionStart(now)
  }

  const selectAnswer = (choiceId: string) => {
    recordTime()
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: choiceId,
    }))
  }

  const goToQuestion = (questionNumber: number) => {
    recordTime()
    setCurrent(questionNumber - 1)
  }

  const next = () => {
    if (current < questions.length - 1) {
      recordTime()
      setCurrent((c) => c + 1)
    }
  }

  const prev = () => {
    if (current > 0) {
      recordTime()
      setCurrent((c) => c - 1)
    }
  }

  // --- 2. แก้ไขฟังก์ชัน Submit ให้บันทึกลง Database ตามโครงสร้างที่วางไว้ ---
  const handleSubmit = async (isAuto = false) => {
    if (!isAuto && !window.confirm('ยืนยันการส่งข้อสอบทั้งหมดใช่หรือไม่?')) return

    setIsSubmitting(true)
    recordTime()

    try {
      // ดึงเฉลยมาตรวจ
      const { data: correctChoices } = await supabase
        .from('choices')
        .select('id, question_id, is_correct')
        .in('question_id', questions.map(q => q.id))
        .eq('is_correct', true)

      const correctMap = correctChoices?.reduce((acc, curr) => {
        acc[curr.question_id] = curr.id
        return acc
      }, {} as Record<string, string>) || {}

      let totalScore = 0
      const topicStats: Record<string, { correct: number; total: number; name: string }> = {}
      const answerDetails: any[] = []

      questions.forEach(q => {
        const userAnswerId = answers[q.id]
        
        const isCorrect = userAnswerId === correctMap[q.id]
        if (isCorrect) totalScore++

        if (!topicStats[q.topic_id]) {
          topicStats[q.topic_id] = { correct: 0, total: 0, name: q.topic_name }
        }
        topicStats[q.topic_id].total++
        if (isCorrect) topicStats[q.topic_id].correct++

        answerDetails.push({
          question_id: q.id,
          selected_choice_id: userAnswerId || null,
          is_correct: isCorrect
        })
      })

      // บันทึกลง exam_attempts
      const { data: attempt, error: attemptError } = await supabase
        .from('exam_attempts')
        .insert({
          user_id: userId,
          exam_set_id: examSetId,
          score: totalScore,
          total_questions: questions.length,
          topic_results: topicStats,
          started_at: startedAt.current,
          completed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (attemptError) throw attemptError

      // บันทึกลง exam_answer_details
      const detailsToInsert = answerDetails.map(d => ({ ...d, attempt_id: attempt.id }))
      await supabase.from('exam_answer_details').insert(detailsToInsert)

      localStorage.removeItem(`exam_cache_${examSetId}_${userId}`)

      // พาไปหน้าสรุปผล (หรือจะใช้ setResult แบบเดิมที่คุณมีก็ได้)
      router.push(`/exam/result/${attempt.id}`)

    } catch (err) {
      console.error(err)
      alert('เกิดข้อผิดพลาดในการส่งข้อสอบ')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isInitialized || !currentQuestion) return <div className="p-10 text-center">กำลังโหลดข้อสอบ...</div>

  // --- UI เดิมของคุณทั้งหมด ---
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">{title || 'แบบทดสอบ'}</h1>
        <p className="text-slate-500 text-sm">กรุณาเลือกคำตอบที่ถูกต้องที่สุด</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="w-full bg-white rounded-xl p-8 shadow-sm border border-slate-100">
          <Timer
            startedAt={startedAt.current}
            duration={examDuration}
            onTimeUp={handleTimeUp}
          />

          <QuestionCard
            question={currentQuestion}
            selected={answers[currentQuestion.id]}
            onSelect={selectAnswer}
          />

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={prev}
              disabled={current === 0}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold transition-all hover:bg-blue-700 disabled:opacity-40 shadow-md"
            >
              ข้อที่แล้ว
            </button>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
              ข้อ {current + 1} / {questions.length}
            </span>
            <button
              onClick={next}
              disabled={current === questions.length - 1}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold transition-all hover:bg-blue-700 disabled:opacity-40 shadow-md"
            >
              ข้อต่อไป
            </button>
          </div>
        </div>

        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-100 max-h-[calc(100vh-2rem)] overflow-y-auto lg:sticky lg:top-4 p-10">
          <h3 className="font-bold text-center mb-6 text-slate-800 border-b pb-4">
            สถานะการทำข้อสอบ
          </h3>
          <QuestionNavigator
            total={questions.length}
            current={current + 1}
            answers={Object.fromEntries(
              questions.map((q, i) => [
                i + 1,
                answers[q.id] ? 'done' : undefined,
              ])
            )}
            onChange={goToQuestion}
          />



          {/* --- ส่วนอธิบายสี (Legend) แบบแก้บัคโดนเบียด --- */}
          <div className="mt-8 pt-6 border-t border-slate-500 flex flex-wrap justify-center gap-x-6 gap-y-3">

            {/* กำลังทำอยู่ */}
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-400 shrink-0 shadow-sm" />
              <span className="ml-2 text-[11px] font-black text-slate-400 uppercase tracking-tight whitespace-nowrap">
                กำลังทำอยู่
              </span>
            </div>

            {/* ทำข้อสอบแล้ว */}
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-slate-900 shrink-0 shadow-sm" />
              <span className="ml-2 text-[11px] font-black text-slate-400 uppercase tracking-tight whitespace-nowrap">
                ทำข้อสอบแล้ว
              </span>
            </div>

            {/* ยังไม่ได้ทำ */}
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-white border-2 border-slate-200 shrink-0" />
              <span className="ml-2 text-[11px] font-black text-slate-400 uppercase tracking-tight whitespace-nowrap">
                ยังไม่ได้ทำ
              </span>
            </div>

          </div>
          <button
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black shadow-lg disabled:bg-slate-400"
          >
            {isSubmitting ? 'กำลังส่งข้อสอบ...' : 'ส่งข้อสอบทั้งหมด'}
          </button>
        </div>
      </div>
    </div>
  )
}