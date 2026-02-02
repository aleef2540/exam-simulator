import clsx from 'clsx'
import { QuestionStatus } from './types'

type Props = {
  number: number
  status: QuestionStatus
  onClick: () => void
}

export default function QuestionButton({
  number,
  status,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full border text-sm font-semibold transition',
        status === 'current' &&
          'bg-yellow-400 text-white border-yellow-500',
        status === 'done' &&
          'bg-gray-700 text-white border-gray-700',
        status === 'empty' &&
          'bg-white text-gray-700 hover:bg-gray-100'
      )}
    >
      {number}
    </button>
  )
}
