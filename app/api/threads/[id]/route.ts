import { type NextRequest, NextResponse } from "next/server"
import { forumClient } from "@/lib/forum-client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[v0] Fetching thread with id:", id)

    const thread = await forumClient.threads.retrieve(id)

    // Fetch posts for this thread
    let replies: any[] = []
    try {
      const postsResponse = await forumClient.threads.getPosts(id, { filter: "oldest" })
      replies = postsResponse.posts || []
    } catch (e) {
      console.log("[v0] Could not fetch posts:", e)
    }

    console.log("[v0] Thread fetched:", thread)
    console.log("[v0] Replies fetched:", replies.length)

    return NextResponse.json({
      thread: {
        ...thread,
        replies,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error fetching thread:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, content, userId, extendedData } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const updatePayload: any = { userId }
    if (title) updatePayload.title = title
    if (content) updatePayload.body = content
    if (extendedData) updatePayload.extendedData = extendedData

    const updatedThread = await forumClient.threads.update(id, updatePayload)

    return NextResponse.json({ thread: updatedThread })
  } catch (error: any) {
    console.error("[v0] Error updating thread:", error)
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

    await forumClient.threads.delete(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting thread:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
