"use client"

import { createTRPCReact } from "@trpc/react-query"
import { type AppRouter } from "@/trpc/server"

// フロントエンドtRPCクライアント
export const trpc = createTRPCReact<AppRouter>({})
