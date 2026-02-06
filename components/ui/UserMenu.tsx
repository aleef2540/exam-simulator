'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LogoutButton from './LogoutButton'
import { supabase } from '@/lib/supabase/client'

type Props = {
  email?: string | null
}

export default function UserMenu({ email }: Props) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<string | null>(null)

  // ฟังก์ชันสำหรับปิดเมนู
  const closeMenu = () => setOpen(false)

  useEffect(() => {
    const loadRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      setRole(data?.role ?? null)
    }

    loadRole()
  }, [])

  if (!email) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
      >
        เข้าสู่ระบบ
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 transition"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
          {email[0].toUpperCase()}
        </div>
      </button>

      {open && (
        <>
          {/* 🟢 Backdrop: คลิกพื้นที่ว่างข้างนอกเพื่อปิดเมนู */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={closeMenu} 
          />
          
          <div
            className="
              absolute right-0 mt-2 w-52
              bg-white
              border border-slate-200
              rounded-xl
              shadow-lg
              overflow-hidden
              z-50
            "
          >
            <div className="px-4 py-3 text-sm text-slate-500 truncate">
              {email}
            </div>

            <div className="border-t" />

            {/* 🟢 ใส่ onClick={closeMenu} ให้ทุกลิงก์เพื่อให้เมนูปิดเมื่อเปลี่ยนหน้า */}
            <Link
              href="/dashboard"
              onClick={closeMenu}
              className="block px-4 py-2 text-sm hover:bg-slate-50"
            >
              แดชบอร์ด
            </Link>

            <Link
              href="/stats"
              onClick={closeMenu}
              className="block px-4 py-2 text-sm hover:bg-slate-50"
            >
              ดูสถิติ
            </Link>

            {role === 'admin' && (
              <>
                <Link
                  href="/admin/questions"
                  onClick={closeMenu}
                  className="block px-4 py-2 text-sm hover:bg-slate-50 text-blue-600 font-medium"
                >
                  จัดการข้อสอบ
                </Link>
                <Link
                  href="/admin/exam-sets/"
                  onClick={closeMenu}
                  className="block px-4 py-2 text-sm hover:bg-slate-50 text-blue-600 font-medium"
                >
                  จัดการชุดข้อสอบ
                </Link>
              </>
            )}

            <div className="border-t" />

            {/* 🟢 เมื่อ Logout ให้ปิดเมนูด้วย */}
            <div className="px-4 py-2" onClick={closeMenu}>
              <LogoutButton />
            </div>
          </div>
        </>
      )}
    </div>
  )
}