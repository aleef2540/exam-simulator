import Image from 'next/image'

type Choice = {
  id: string
  choice_text: string | null
}

type Props = {
  question: {
    question_text: string | null
    question_type: 'text' | 'image'
    image_url?: string | null
    choices: Choice[]
  }
  selected?: string
  onSelect: (choiceId: string) => void
}

export default function QuestionCard({
  question,
  selected,
  onSelect,
}: Props) {
  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-4">

      {/* ===== QUESTION ===== */}
      <div className="text-lg font-medium space-y-4">

        {/* 📝 text question */}
        {question.question_type === 'text' && question.question_text && (
          <div className="whitespace-pre-wrap">
            {question.question_text}
          </div>
        )}

        {/* 🖼 image question */}
        {question.question_type === 'image' && question.image_url && (
          <div className="flex justify-center">
            <Image
              src={question.image_url}
              alt="question image"
              width={500}
              height={350}
              className="rounded-lg border"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        {question.choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => onSelect(choice.id)}
            className={`
              w-full text-left px-4 py-3 rounded border transition
              ${selected === choice.id
                ? 'border-blue-600 bg-blue-50'
                : 'hover:bg-slate-50'
              }
            `}
          >
            {choice.choice_text}
          </button>
        ))}
      </div>
    </div>
  )
}
