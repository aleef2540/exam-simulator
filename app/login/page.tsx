import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 🔒 ถ้า login แล้ว → ไม่ให้เข้า login
  if (user) {
    redirect("/");
  }

  return <LoginForm />;
}
