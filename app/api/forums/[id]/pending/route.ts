import { type NextRequest, NextResponse } from "next/server"
import { forumStore } from "@/lib/forum-store"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const posts = forumStore.getPendingPosts ? await forumStore.getPendingPosts(id) : []
  return NextResponse.json({ data: posts })
}
