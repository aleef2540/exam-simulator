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
  selected?: string | null
  onSelect: (choiceId: string) => void
  isReview?: boolean
  correctAnswerId?: string
}

export default function QuestionCard({
  question,
  selected,
  onSelect,
  isReview = false,
  correctAnswerId
}: Props) {
  // เช็คสถานะข้อนี้แบบปลอดภัย
  const isCorrect = selected === correctAnswerId;
  const isUnanswered = !selected;

  // ถ้าไม่มีข้อมูล question ให้แสดงข้อความแจ้งเตือน (กัน Error หน้าขาว)
  if (!question) return <div className="p-4 text-slate-400">ไม่พบข้อมูลคำถาม</div>;

  return (
    <div className="bg-white space-y-6">
      
      {/* 🚩 แถบสถานะด้านบน */}
      {isReview && (
        <div className="pb-4 border-b-2 border-slate-50">
          {isUnanswered ? (
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-xl">⚪</span>
              <p className="text-lg font-black uppercase tracking-tight">คุณตอบไม่ทัน / ไม่ได้ตอบ</p>
            </div>
          ) : isCorrect ? (
            <div className="flex items-center gap-2 text-emerald-500">
              <span className="text-xl">✅</span>
              <p className="text-lg font-black uppercase tracking-tight">คุณตอบถูกต้อง</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-rose-500">
              <span className="text-xl">❌</span>
              <p className="text-lg font-black uppercase tracking-tight">คุณตอบผิด</p>
            </div>
          )}
        </div>
      )}

      {/* 📝 ส่วนโจทย์ */}
      <div className="text-xl font-bold text-slate-800 leading-relaxed pt-2">
        {question.question_text && (
          <div className="whitespace-pre-wrap mb-4">{question.question_text}</div>
        )}

        {question.question_type === 'image' && question.image_url && (
          <div className="flex flex-col items-center gap-4 my-4">
            <div className="relative w-full h-[300px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
              <Image
                src={question.image_url}
                alt="question"
                fill
                className="object-contain p-2"
                unoptimized // ป้องกันเรื่อง Domain Image ใน Next.js
              />
            </div>
          </div>
        )}
      </div>

      {/* 🔘 ส่วนตัวเลือก */}
      <div className="space-y-3 mt-6">
        {question.choices?.map((choice) => {
          const isThisCorrect = choice.id === correctAnswerId;
          const isThisSelected = selected === choice.id;

          let style = "border-slate-200 text-slate-600"; 
          if (isReview) {
            if (isThisCorrect) {
              style = "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20";
            } else if (isThisSelected && !isThisCorrect) {
              style = "border-rose-500 bg-rose-50 text-rose-700";
            } else {
              style = "border-slate-100 text-slate-400 opacity-60";
            }
          }

          return (
            <div key={choice.id} className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl border-2 transition-all ${style}`}>
              <span className="font-bold text-lg">{choice.choice_text}</span>
              {isReview && (
                <div className="flex items-center gap-2">
                  {isThisCorrect && <span className="bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest">เฉลย</span>}
                  {isThisSelected && !isThisCorrect && <span className="bg-rose-500 text-white text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest">คุณตอบ</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}