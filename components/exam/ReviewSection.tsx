"use client";

import { useState } from 'react';
import QuestionCard from './QuestionCard';
import QuestionNavigator from './QuestionNavigator';

export default function ReviewSection({ details, totalQuestions }: any) {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((p) => Math.max(0, p - 1));
  const next = () => setCurrent((p) => Math.min(details.length - 1, p + 1));

  // ค้นหา ID ของข้อที่ถูกต้องเพื่อส่งไปให้ QuestionCard ไฮไลท์สีเขียว
  const correctAnswerId = details[current]?.questions?.choices?.find(
    (c: any) => c.is_correct
  )?.id;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-16 border-t pt-16">
      {/* ฝั่งซ้าย: แสดงโจทย์และตัวเลือก */}
      <div className="w-full bg-white rounded-xl p-8 shadow-sm border border-slate-100">
        <QuestionCard
          question={details[current].questions}
          selected={details[current].selected_choice_id}
          onSelect={() => {}} // ปิดการกดเลือก
          isReview={true}
          correctAnswerId={correctAnswerId}
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
            ข้อ {current + 1} / {totalQuestions}
          </span>
          <button
            onClick={next}
            disabled={current === details.length - 1}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold transition-all hover:bg-blue-700 disabled:opacity-40 shadow-md"
          >
            ข้อต่อไป
          </button>
        </div>
      </div>

      {/* ฝั่งขวา: Navigator วงกลมบอกสถานะ */}
      <div className="w-full bg-white rounded-xl shadow-sm border border-slate-100 max-h-[calc(100vh-2rem)] overflow-y-auto lg:sticky lg:top-4 p-10 text-center">
        <h3 className="font-bold text-center mb-6 text-slate-800 border-b pb-4 uppercase tracking-widest text-xs">
          สถานะการทำข้อสอบ (เฉลย)
        </h3>
        
        <QuestionNavigator
          total={totalQuestions}
          current={current + 1}
          answers={Object.fromEntries(
            details.map((d: any, i: number) => {
              let status: string;
              // ถ้าไม่ได้ตอบ (null) ให้ส่งสถานะ empty ไปที่ปุ่ม
              if (d.selected_choice_id === null) {
                status = 'empty'; 
              } else {
                status = d.is_correct ? 'correct' : 'wrong';
              }
              return [i + 1, status];
            })
          )}
          onChange={(idx: number) => setCurrent(idx - 1)}
        />

        {/* Legend อธิบายสี */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap justify-center gap-x-6 gap-y-3">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-emerald-400 border border-emerald-500 shrink-0" />
            <span className="ml-2 text-[11px] font-black text-slate-500 uppercase">ตอบถูก</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-rose-400 border border-rose-500 shrink-0" />
            <span className="ml-2 text-[11px] font-black text-slate-500 uppercase">ตอบผิด</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-white border border-slate-300 shrink-0" />
            <span className="ml-2 text-[11px] font-black text-slate-500 uppercase">ไม่ได้ทำ/ไม่ทัน</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-400 border border-blue-500 shrink-0" />
            <span className="ml-2 text-[11px] font-black text-slate-500 uppercase">กำลังดูอยู่</span>
          </div>
        </div>
      </div>
    </div>
  );
}