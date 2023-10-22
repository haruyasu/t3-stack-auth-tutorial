import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/nextauth"
import Login from "@/components/auth/Login"

// ログインページ
const LoginPage = async () => {
  // 認証情報取得
  const user = await getAuthSession()

  if (user) {
    redirect("/")
  }

  return <Login />
}

export default LoginPage
