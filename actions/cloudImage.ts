import { TRPCError } from "@trpc/server"
import cloudinary from "cloudinary"

// Cloudinaryの設定
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Cloudinaryに画像アップロード
export const createCloudImage = async (base64Image: string) => {
  try {
    // 画像をアップロード
    const imageResponse = await cloudinary.v2.uploader.upload(base64Image, {
      resource_type: "image",
      folder: "t3stackblog",
    })

    // 画像のURLを返す
    return imageResponse.secure_url
  } catch (error) {
    console.log(error)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "画面のアップロードに失敗しました",
    })
  }
}

// Cloudinaryの画像削除
export const deleteCloudImage = async (publicId: string) => {
  try {
    // 画像を削除
    await cloudinary.v2.uploader.destroy(publicId)
  } catch (error) {
    console.log(error)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "画像の削除に失敗しました",
    })
  }
}
