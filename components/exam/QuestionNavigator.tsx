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

    if (questionNumber === current) return 'current'
    if (answers[questionNumber] !== undefined) return 'done'
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
