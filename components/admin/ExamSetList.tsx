'use client'

import Link from 'next/link'
import React, { useState } from 'react'
import {
    Trash2, Edit, Search, Plus, BookOpen, ChevronDown, 
    ListOrdered, AlertCircle, Hash, Clock 
} from 'lucide-react'

type TopicItem = {
    question_count: number
    sort_order?: number
    topics: { name: string } | { name: string }[] | null
}

type ExamSet = {
    id: string
    name: string
    description: string | null
    duration: number
    exam_set_topics: TopicItem[]
}

export default function ExamSetList({ examSets }: { examSets: ExamSet[] }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const filteredSets = examSets.filter(set =>
        set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (set.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="w-full space-y-4 font-sans text-slate-900">
            {/* Search & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อชุดข้อสอบ..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Link href="/admin/exam-sets/new">
                    <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                        <Plus size={18} />เพิ่มชุดข้อสอบใหม่
                    </button>
                </Link>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">ชื่อชุดข้อสอบ</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">เวลา</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">หัวข้อ</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">รวม (ข้อ)</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredSets.length > 0 ? filteredSets.map((set) => {
                                const totalQuestions = set.exam_set_topics.reduce((acc, curr) => acc + curr.question_count, 0);
                                const isExpanded = expandedId === set.id;
                                return (
                                    <React.Fragment key={set.id}>
                                        <tr className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`} onClick={() => setExpandedId(isExpanded ? null : set.id)}>
                                            <td className="px-6 py-5"><div className="flex items-center gap-3"><div className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}><ChevronDown size={18} className={isExpanded ? 'text-indigo-600' : 'text-slate-400'} /></div><div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hidden sm:block"><BookOpen size={18} /></div><div><div className="font-bold">{set.name}</div><div className="text-xs text-slate-400 italic line-clamp-1">{set.description || 'ไม่มีรายละเอียด'}</div></div></div></td>
                                            <td className="px-6 py-5 text-center"><div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-100 font-bold text-xs"><Clock size={14} />{set.duration || 60} น.</div></td>
                                            <td className="px-6 py-5 text-center"><span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{set.exam_set_topics.length} หัวข้อ</span></td>
                                            <td className="px-6 py-5 text-center"><span className="bg-slate-900 text-white px-3 py-1 rounded-lg font-bold text-xs">{totalQuestions}</span></td>
                                            <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}><div className="flex justify-end gap-1"><button className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><Edit size={18} /></button><button className="p-2 text-slate-400 hover:text-red-600 transition-all" onClick={() => confirm(`ลบชุดข้อสอบ: ${set.name}?`)}><Trash2 size={18} /></button></div></td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={5} className="px-10 py-6 bg-slate-50/80 border-b border-slate-200">
                                                    <div className="border-l-4 border-indigo-400 pl-6 space-y-4">
                                                        <div className="flex items-center gap-2"><ListOrdered size={16} className="text-indigo-500" /><h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">หัวข้อและสัดส่วน</h4></div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {[...set.exam_set_topics].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((item, idx) => (
                                                                <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                                                                    <div className="flex items-center gap-2"><span className="text-[10px] bg-indigo-50 text-indigo-500 w-5 h-5 flex items-center justify-center rounded font-bold">{idx + 1}</span><span className="text-sm font-semibold">{Array.isArray(item.topics) ? item.topics[0]?.name : item.topics?.name}</span></div>
                                                                    <div className="flex items-center gap-1 text-indigo-600 font-black text-sm"><Hash size={12} className="text-slate-300" />{item.question_count}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            }) : (
                                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-300"><div className="flex flex-col items-center gap-2"><AlertCircle size={48} strokeWidth={1} /><p className="text-sm font-medium uppercase italic text-slate-400">ไม่พบข้อมูล</p></div></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}