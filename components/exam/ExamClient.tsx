'use client'

import { useRef, useState } from 'react'
import Timer from './Timer'
import QuestionCard from './QuestionCard'
import QuestionNavigator from './QuestionNavigator'
import { submitExamAction } from '@/app/exam/actions'


type Choice = {
  id: string
  choice_text: string | null
}

type Question = {
  id: string
  question_text: string
  question_type: 'text' | 'image'
  image_url?: string | null
  choices: Choice[]
}

// 🟢 แก้ไข: เพิ่ม title และ duration ในการรับ Props
export default function ExamClient({
  questions,
  title,
  duration,
}: {
  questions: Question[]
  title?: string
  duration?: number
}) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeUsed, setTimeUsed] = useState<Record<string, number>>({})
  const [questionStart, setQuestionStart] = useState(Date.now())

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number, total: number } | null>(null)


  const currentQuestion = questions[current]

  // 🟢 แก้ไข: ใช้ค่าจริงจาก Props (แปลงนาทีเป็นวินาทีสำหรับ Timer)
  const startedAt = useRef<string>(new Date().toISOString())
  const examDuration = (duration || 60) * 60

  const handleTimeUp = () => {
    alert('หมดเวลาแล้ว!')
    console.log('ส่งคำตอบอัตโนมัติ:', answers)
    // ตรงนี้ควรมี Logic การ Submit ไปยัง Database
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
      recordTime() // 🟢 บันทึกเวลาก่อนเปลี่ยนข้อ
      setCurrent((c) => c + 1)
    }
  }

  const prev = () => {
    if (current > 0) {
      recordTime() // 🟢 บันทึกเวลาก่อนเปลี่ยนข้อ
      setCurrent((c) => c - 1)
    }
  }

  const handleSubmit = async () => {
    const isConfirm = window.confirm('ยืนยันการส่งข้อสอบทั้งหมดใช่หรือไม่?')
    if (!isConfirm) return

    setIsSubmitting(true)
    recordTime() // บันทึกเวลาข้อสุดท้าย

    try {
      // 🟢 ส่งไปตรวจที่ Server
      const res = await submitExamAction(questions[0].id, answers)
      setResult(res)
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการส่งข้อสอบ')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 🟢 ส่วนการแสดงผลคะแนน
  if (result) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-10 bg-white rounded-[32px] shadow-2xl text-center">
        <h2 className="text-3xl font-black mb-4">สรุปผลคะแนน</h2>
        <div className="text-7xl font-black text-blue-600 mb-4">
          {result.score} <span className="text-3xl text-slate-300">/ {result.total}</span>
        </div>
        <p className="text-slate-500 mb-8 font-bold">ยอดเยี่ยม! คุณทำได้ดีมาก</p>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black"
        >
          กลับหน้าหลัก
        </button>
      </div>
    )
  }


  // ป้องกันกรณี questions เป็นค่าว่าง
  if (!currentQuestion) return <div className="p-10 text-center">กำลังโหลดข้อสอบ...</div>

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 🟢 เพิ่ม: แสดงชื่อชุดข้อสอบที่ด้านบน */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">{title || 'แบบทดสอบ'}</h1>
        <p className="text-slate-500 text-sm">กรุณาเลือกคำตอบที่ถูกต้องที่สุด</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ฝั่งซ้าย: ตัวข้อสอบ */}
        <div className="w-full bg-white rounded-xl p-8 shadow-sm border border-slate-100">
          <Timer
            startedAt={startedAt.current}
            duration={examDuration} // 🟢 ใช้ค่าจริงที่คำนวณแล้ว
            onTimeUp={handleTimeUp}
          />

          <QuestionCard
            question={currentQuestion}
            selected={answers[currentQuestion.id]}
            onSelect={selectAnswer}
          />

          {/* ส่วนของปุ่มควบคุมด้านล่าง QuestionCard */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={prev}
              // 🟢 ถ้าอยู่ข้อแรก (0) ให้ปิดการทำงาน
              disabled={current === 0}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold transition-all hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              ข้อที่แล้ว
            </button>

            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
              ข้อ {current + 1} / {questions.length}
            </span>

            <button
              onClick={next}
              // 🟢 ถ้าอยู่ข้อสุดท้าย ให้ปิดการทำงาน
              disabled={current === questions.length - 1}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold transition-all hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              ข้อต่อไป
            </button>
          </div>
        </div>

        {/* ฝั่งขวา: Navigator */}
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

          {/* legend */}
          <div className="flex gap-6 text-xs text-slate-500 font-bold justify-center mt-10 bg-slate-50 p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-700 rounded-full" /> ทำแล้ว
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-400 rounded-full" /> กำลังทำ
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-slate-200 rounded-full" /> ยังไม่ทำ
            </div>
          </div>

          {/* 🟢 แนะนำ: เพิ่มปุ่มส่งข้อสอบตรงนี้ */}
          <button
            onClick={() => { handleSubmit() }}
            className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all shadow-lg active:scale-95"
          >
            ส่งข้อสอบทั้งหมด
          </button>
        </div>
      </div>
    </div>
  )
}