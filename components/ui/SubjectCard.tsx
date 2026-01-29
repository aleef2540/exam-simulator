'use client'

import { useRouter } from "next/navigation";

type Props = {
  title: string;
  subject: string;
  description?: string;
};

export default function SubjectCard({
  title,
  subject,
  description,
}: Props) {
  const router = useRouter();

  return (
    <div className="
    bg-white
    rounded-2xl
    border border-slate-100
    shadow-[0_8px_30px_rgb(0,0,0,0.04)]
    hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)]
    transition-all duration-300">
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-1">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-slate-500 mb-4">
            {description}
          </p>
        )}

        <button
          onClick={() => router.push(`/exam?subject=${subject}`)}
          className="
          w-full
          bg-blue-600
          text-white
          py-2.5
          rounded-xl
          font-medium
          transition-all duration-200
          hover:bg-blue-700
          hover:-translate-y-0.5
          active:translate-y-0"
        >
          เริ่มทำข้อสอบ
        </button>
      </div>
    </div>
  );
}
