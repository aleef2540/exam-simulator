import QuestionButton from './QuestionButton'
import { QuestionStatus } from './types'

type Props = {
  total: number
  current: number
  answers: Record<string, string | undefined>
  onChange: (questionNumber: number) => void
}

export default function QuestionNavigator({
  total,
  current,
  answers,
  onChange,
}: Props) {

  const getStatus = (index: number): QuestionStatus => {
    const questionNumber = index+1
    const statusFromProps = answers[questionNumber]

    
    
    // ถ้าเป็นข้อที่กำลังเปิดดูอยู่ ให้เป็น 'current' (สีเหลือง)
  if (questionNumber === current) {
    if(statusFromProps === 'correct' || statusFromProps === 'wrong' || statusFromProps === 'empty'){return 'on'}
    return 'current'
  }
  if (statusFromProps === 'empty') return 'empty'
  
  // ถ้าใน answers ส่ง 'correct' หรือ 'wrong' มา ให้ใช้ค่านั้นเลย
  if (statusFromProps === 'correct' || statusFromProps === 'wrong') {
    return statusFromProps as QuestionStatus
  }

  // ถ้ามีการตอบแล้วแต่ไม่ใช่การเฉลย ให้เป็น 'done' (สีดำ)
  if (statusFromProps !== undefined) return 'done'

// ถ้ายังไม่ได้ทำ
  return 'empty'
  }

  return (
    <div className="
    grid
    grid-cols-4
    gap-5
    sm:grid-cols-5
    md:grid-cols-6
    lg:grid-cols-8
    xl:grid-cols-10
  ">
      {Array.from({ length: total }).map((_, index) => (
        <QuestionButton
          key={index}
          number={index + 1}
          status={getStatus(index)}
          onClick={() => onChange(index + 1)}
        />
      ))}
    </div>
  )
}
