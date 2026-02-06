'use client'

import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import UserMenu from '@/components/ui/UserMenu'
import { useRouter, usePathname } from 'next/navigation' // 1. นำเข้า usePathname

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname() // 2. ประกาศตัวแปร pathname

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email ?? null)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserEmail(session?.user?.email ?? null)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  // 3. ถ้าอยู่ที่หน้า /login ให้ไม่ต้องแสดง Navbar (return null)
  if (pathname === '/login') return null

  return (
    <header className="bg-white/75 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="bg-blue-600 p-2 rounded-xl">
            <GraduationCap className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">EXAM HUB</h1>
        </Link>

        {userEmail ? (
          <UserMenu email={userEmail} />
        ) : (
          <Link href="/login" className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold active:scale-95 transition-transform">
            เข้าสู่ระบบ
          </Link>
        )}
      </div>
    </header>
  )
}