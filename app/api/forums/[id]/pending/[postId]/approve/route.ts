import { type NextRequest, NextResponse } from "next/server"
import { forumStore } from "@/lib/forum-store"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; postId: string }> }) {
  const { postId } = await params

  const post = forumStore.approvePendingPost ? await forumStore.approvePendingPost(postId, "system") : null
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  return NextResponse.json(post)
}
