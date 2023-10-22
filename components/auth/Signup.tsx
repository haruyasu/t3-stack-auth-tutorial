"use client"

import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FcGoogle } from "react-icons/fc"
import { trpc } from "@/trpc/react"
import { Loader2 } from "lucide-react"
import { signIn } from "next-auth/react"
import toast from "react-hot-toast"
import Link from "next/link"

// 入力データの検証ルールを定義
const schema = z.object({
  name: z.string().min(2, { message: "2文字以上入力する必要があります" }),
  email: z.string().email({ message: "メールアドレスの形式ではありません" }),
  password: z.string().min(8, { message: "8文字以上入力する必要があります" }),
})

// 入力データの型を定義
type InputType = z.infer<typeof schema>

// サインアップ
const Signup = () => {
  const router = useRouter()

  // フォームの状態
  const form = useForm<InputType>({
    // 入力値の検証
    resolver: zodResolver(schema),
    // 初期値
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  // Googleアカウントでサインアップ
  const handleGoogleSingup = async () => {
    try {
      const result = await signIn("google", { callbackUrl: "/" })

      if (result?.error) {
        toast.error("アカウント作成に失敗しました")
      }
    } catch (error) {
      toast.error("アカウント作成に失敗しました")
    }
  }

  // サインアップ
  const { mutate: singUp, isLoading } = trpc.auth.singUp.useMutation({
    onSuccess: () => {
      toast.success("アカウントを作成しました!")

      // ログイン
      signIn("credentials", {
        email: form.getValues("email"),
        password: form.getValues("password"),
        callbackUrl: "/",
      })

      router.refresh()
    },
    onError: (error) => {
      toast.error("アカウント作成に失敗しました")
      console.error(error)
    },
  })

  // 送信
  const onSubmit: SubmitHandler<InputType> = (data) => {
    // サインアップ
    singUp(data)
  }

  return (
    <div className="max-w-[400px] m-auto">
      <div className="text-2xl font-bold text-center mb-10">新規登録</div>

      <Button variant="outline" className="w-full" onClick={handleGoogleSingup}>
        <FcGoogle className="mr-2 h-4 w-4" />
        Googleアカウント
      </Button>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-2 text-muted-foreground">OR</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>名前</FormLabel>
                <FormControl>
                  <Input placeholder="名前" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>メールアドレス</FormLabel>
                <FormControl>
                  <Input placeholder="xxxx@gmail.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>パスワード</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="text-sm text-gray-500">
            サインアップすることで、利用規約、プライバシーポリシーに同意したことになります。
          </div>

          <Button disabled={isLoading} type="submit" className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            アカウント作成
          </Button>
        </form>
      </Form>

      <div className="text-center mt-5">
        <Link href="/login" className="text-sm text-blue-500">
          すでにアカウントをお持ちの方
        </Link>
      </div>
    </div>
  )
}

export default Signup
