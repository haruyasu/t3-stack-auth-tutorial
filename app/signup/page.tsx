import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/nextauth"
import Signup from "@/components/auth/Signup"

// サインアップページ
const SignupPage = async () => {
  // 認証情報取得
  const user = await getAuthSession()

  if (user) {
    redirect("/")
  }

  return <Signup />
}

export default SignupPage
