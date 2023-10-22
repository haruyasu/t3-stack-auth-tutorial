import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/nextauth"
import Profile from "@/components/settings/Profile"

// プロフィールページ
const ProfilePage = async () => {
  // 認証情報取得
  const user = await getAuthSession()

  if (!user) {
    redirect("/login")
  }

  return <Profile user={user} />
}

export default ProfilePage
