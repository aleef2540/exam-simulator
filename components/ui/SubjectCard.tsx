'use client'

import Link from 'next/link';
import { BookOpen, PlayCircle, Clock, ChevronRight } from 'lucide-react';

interface SubjectCardProps {
  id: string;
  title: string;
  subject: string;
  description: string;
  totalQuestions: number;
  duration: number;
}

export default function SubjectCard({ id, title, subject, description, totalQuestions }: SubjectCardProps) {
  // เลือกสีตามวิชา
  const themes: any = {
    math: "bg-orange-50 text-orange-600 border-orange-100",
    thai: "bg-emerald-50 text-emerald-600 border-emerald-100",
    english: "bg-blue-50 text-blue-600 border-blue-100",
  };

  const theme = themes[subject] || themes.english;

  return (
    <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-500 group">
      <div className="p-7 pb-5">
        <div className={`w-14 h-14 rounded-2xl mb-5 flex items-center justify-center border shadow-sm ${theme} group-hover:scale-110 transition-transform duration-500`}>
          <BookOpen size={28} />
        </div>
        <div className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase mb-2">
          {subject}
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 font-medium leading-relaxed">
          {description}
        </p>
      </div>

      <div className="px-7 py-4 bg-slate-50/50 border-t border-slate-100 mt-auto">
        <div className="flex items-center justify-between text-slate-500 mb-5">
          <div className="flex items-center gap-1.5">
            <PlayCircle size={16} className="text-blue-500" />
            <span className="text-xs font-bold">{totalQuestions} ข้อ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-slate-400" />
            <span className="text-xs font-bold">60 นาที</span>
          </div>
        </div>

        <Link href={`/exam/${id}`}>
          <button className="w-full py-4 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-lg shadow-slate-200">
            เริ่มทำข้อสอบ
            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </Link>
      </div>
    </div>
  );
}