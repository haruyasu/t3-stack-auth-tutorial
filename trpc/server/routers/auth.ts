import { publicProcedure, privateProcedure, router } from "@/trpc/server/trpc"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { sendForgotPassword } from "@/actions/sendForgotPassword"
import { sendResetPassword } from "@/actions/sendResetPassword"
import prisma from "@/lib/prisma"
import bcrypt from "bcrypt"
import crypto from "crypto"

const ONE_SECOND = 1000
const ONE_MINUTE = ONE_SECOND * 60
const ONE_HOUR = ONE_MINUTE * 60
const ONE_DAY = ONE_HOUR * 24

export const authRouter = router({
  // サインアップ
  singUp: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { name, email, password } = input

        // メールアドレスの重複チェック
        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "既に登録されているメールアドレスです",
          })
        }

        // パスワードのハッシュ化
        const hashedPassword = await bcrypt.hash(password, 12)

        // ユーザーの作成
        await prisma.user.create({
          data: {
            email,
            name,
            hashedPassword,
          },
        })
      } catch (error) {
        console.log(error)

        if (error instanceof TRPCError && error.code === "BAD_REQUEST") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          })
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "エラーが発生しました",
          })
        }
      }
    }),

  // パスワード変更
  updatePassword: privateProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { currentPassword, password } = input
        const userId = ctx.user.id

        // ユーザーの検索
        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        })

        if (!user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "ユーザーが存在しません",
          })
        }

        if (!user.hashedPassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "パスワードが設定されていません",
          })
        }

        // 現在のパスワードと一致するか
        const isCurrentPasswordValid = await bcrypt.compare(
          currentPassword,
          user.hashedPassword
        )

        // 現在のパスワードが間違っている場合
        if (!isCurrentPasswordValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "現在のパスワードが間違っています",
          })
        }

        // 新しいパスワードと現在のパスワードを比較
        const isSamePassword = await bcrypt.compare(
          password,
          user.hashedPassword
        )

        // 新しいパスワードと現在のパスワードが同じ場合
        if (isSamePassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "現在のパスワードを新しいパスワードが同じです。別のパスワードを設定してください",
          })
        }

        // パスワードのハッシュ化
        const hashedNewPassword = await bcrypt.hash(password, 12)

        // パスワードの更新
        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            hashedPassword: hashedNewPassword,
          },
        })
      } catch (error) {
        console.log(error)

        if (error instanceof TRPCError && error.code === "BAD_REQUEST") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          })
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "エラーが発生しました",
          })
        }
      }
    }),
  // パスワード再設定メール送信
  forgotPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { email } = input

        // ユーザーの検索
        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: email,
              mode: "insensitive",
            },
          },
        })

        if (!user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "ユーザーが存在しません",
          })
        }

        // トークンの検索
        const existingToken = await prisma.passwordResetToken.findFirst({
          where: {
            userId: user.id,
            expiry: {
              gt: new Date(),
            },
            createdAt: {
              gt: new Date(Date.now() - ONE_HOUR),
            },
          },
        })

        if (existingToken) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "既にパスワード再設定用のメールをお送りしました。1時間後に再度お試しください",
          })
        }

        // トークンの作成
        const token = crypto.randomBytes(18).toString("hex")

        // トークンの保存
        await prisma.passwordResetToken.create({
          data: {
            token,
            expiry: new Date(Date.now() + ONE_DAY),
            userId: user.id,
          },
        })

        // メールの送信
        await sendForgotPassword({
          userId: user.id,
        })
      } catch (error) {
        console.log(error)

        if (error instanceof TRPCError && error.code === "BAD_REQUEST") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          })
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "エラーが発生しました",
          })
        }
      }
    }),

  // トークンの有効性を判定
  getResetTokenValidity: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { token } = input

        // トークンの検索
        const foundToken = await prisma.passwordResetToken.findFirst({
          where: {
            token,
          },
          select: {
            id: true,
            expiry: true,
          },
        })

        return !!foundToken && foundToken.expiry > new Date()
      } catch (error) {
        console.log(error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "エラーが発生しました",
        })
      }
    }),

  // パスワード再設定
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { token, password } = input

        // トークンの検索
        const foundToken = await prisma.passwordResetToken.findFirst({
          where: {
            token,
          },
          include: {
            User: true,
          },
        })

        if (!foundToken) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "無効なトークンです。再度パスワード再設定を行ってください",
          })
        }

        // 現在の日時
        const now = new Date()

        // トークンの期限が切れている場合
        if (now > foundToken.expiry) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "トークンの期限が切れています。再度パスワード再設定を行ってください",
          })
        }

        // 新しいパスワードと現在のパスワードを比較
        const isSamePassword = await bcrypt.compare(
          password,
          foundToken.User.hashedPassword || ""
        )

        if (isSamePassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "現在のパスワードと同じパスワードは使用できません",
          })
        }

        // パスワードのハッシュ化
        const hashedPassword = await bcrypt.hash(password, 12)

        await prisma.$transaction([
          // パスワードの更新
          prisma.user.update({
            where: {
              id: foundToken.userId,
            },
            data: {
              hashedPassword,
            },
          }),
          // トークンの削除
          prisma.passwordResetToken.deleteMany({
            where: {
              userId: foundToken.userId,
            },
          }),
        ])

        // メールの送信
        await sendResetPassword({ userId: foundToken.userId })
      } catch (error) {
        console.log(error)

        if (error instanceof TRPCError && error.code === "BAD_REQUEST") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          })
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "エラーが発生しました",
          })
        }
      }
    }),
})
