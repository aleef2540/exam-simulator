'use client'

import { useState } from 'react'
import Link from 'next/link'
import LogoutButton from './LogoutButton'

type Props = {
  email?: string | null
}

export default function UserMenu({ email }: Props) {
  const [open, setOpen] = useState(false)

  // ยังไม่ login → ปุ่ม Login ธรรมดา
  if (!email) {
    return (
      <Link
        href="/login"
        className="
          px-4 py-2
          rounded-lg
          bg-blue-600
          text-white
          text-sm
          hover:bg-blue-700
          transition
        "
      >
        เข้าสู่ระบบ
      </Link>
    )
  }

  // login แล้ว → dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="
          flex items-center gap-2
          px-3 py-1.5
          rounded-full
          hover:bg-slate-100
          transition
        "
      >
        <div className="
          w-8 h-8
          rounded-full
          bg-blue-600
          text-white
          flex items-center justify-center
          text-sm font-medium
        ">
          {email[0].toUpperCase()}
        </div>
      </button>

      {open && (
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
          <div className="px-4 py-3 text-sm text-slate-500">
            {email}
          </div>

          <div className="border-t" />

          <Link
            href="/dashboard"
            className="block px-4 py-2 text-sm hover:bg-slate-50"
          >
            แดชบอร์ด
          </Link>

          <Link
            href="/stats"
            className="block px-4 py-2 text-sm hover:bg-slate-50"
          >
            ดูสถิติ
          </Link>

          <div className="border-t" />

          <div className="px-4 py-2">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  )
}
