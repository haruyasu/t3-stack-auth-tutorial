import { publicProcedure, privateProcedure, router } from "@/trpc/server/trpc"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createCloudImage, deleteCloudImage } from "@/actions/cloudImage"
import { extractPublicId } from "cloudinary-build-url"
import prisma from "@/lib/prisma"

export const userRouter = router({
  // ユーザー情報更新
  updateUser: privateProcedure
    .input(
      z.object({
        name: z.string(),
        introduction: z.string().optional(),
        base64Image: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { name, introduction, base64Image } = input
        const userId = ctx.user.id
        let image_url

        if (base64Image) {
          // ユーザーの検索
          const user = await prisma.user.findUnique({
            where: { id: userId },
          })

          if (!user) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "ユーザーが見つかりませんでした",
            })
          }

          // 古い画像の削除
          if (user.image) {
            const publicId = extractPublicId(user.image)
            await deleteCloudImage(publicId)
          }

          // 新しい画像のアップロード
          image_url = await createCloudImage(base64Image)
        }

        // ユーザー情報更新
        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            name,
            introduction,
            ...(image_url && { image: image_url }),
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
            message: "プロフィール編集に失敗しました",
          })
        }
      }
    }),
})
