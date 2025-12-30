import { type NextRequest, NextResponse } from "next/server"
import { forumClient } from "@/lib/forum-client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const post = await forumClient.posts.retrieve(id)
    return NextResponse.json({ post })
  } catch (error: any) {
    console.error("[v0] Error fetching post:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { content, userId, extendedData } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const updatePayload: any = { userId }
    if (content) updatePayload.body = content
    if (extendedData) updatePayload.extendedData = extendedData

    const updatedPost = await forumClient.posts.update(id, updatePayload)

    return NextResponse.json({ post: updatedPost })
  } catch (error: any) {
    console.error("[v0] Error updating post:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    await forumClient.posts.delete(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting post:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
