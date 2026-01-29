'use client'

import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="
      px-3 py-1.5
      rounded-lg
      text-sm
      text-slate-500
      hover:bg-slate-100
      hover:text-red-600
      transition"
    >
      ออกจากระบบ
    </button>
  );
}
