'use server'

import { createClient } from '@/lib/supabase/server'

export async function submitExamAction(examSetId: string, userAnswers: Record<string, string>) {
  const supabase = await createClient()
  // 1️⃣ ดึงรายชื่อ Choice IDs ที่ผู้ใช้เลือกทั้งหมด
  const selectedChoiceIds = Object.values(userAnswers)
  console.log('Question IDs to check:', selectedChoiceIds)

  // 2️⃣ ไปดึงข้อมูลจากตาราง choices เพื่อดูว่าข้อที่เลือก "ถูกหรือผิด"
  const { data: choices, error } = await supabase
    .from('choices')
    .select('id, question_id, is_correct')
    .in('id', selectedChoiceIds)

  if (error) {
    console.error('Database Error:', error)
    throw new Error('ไม่สามารถตรวจสอบคำตอบได้')
  }

  // 3️⃣ คำนวณคะแนน โดยนับเฉพาะ Choice ที่มี is_correct: true
  let score = 0
  const results = choices.map(choice => {
    if (choice.is_correct) {
      score++
    }
    return {
      questionId: choice.question_id,
      choiceId: choice.id,
      isCorrect: choice.is_correct
    }
  })
// 4️⃣ หาจำนวนข้อทั้งหมด (นับจากจำนวนคำตอบที่ส่งมา)
const totalQuestions = Object.keys(userAnswers).length

return {
  score,
  total: totalQuestions,
  results
}
}