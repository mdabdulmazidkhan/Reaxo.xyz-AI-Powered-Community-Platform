import { type NextRequest, NextResponse } from "next/server"
import { forumClient } from "@/lib/forum-client"

// Like a post
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (token) {
      forumClient.setToken(token)
    }

    console.log("[v0] Liking post:", id, "userId:", userId)
    const response = await forumClient.posts.like(id, userId)
    console.log("[v0] Like response:", response)

    return NextResponse.json({ success: true, data: response })
  } catch (error: any) {
    console.error("[v0] Error liking post:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Unlike a post
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (token) {
      forumClient.setToken(token)
    }

    console.log("[v0] Unliking post:", id, "userId:", userId)
    const response = await forumClient.posts.unlike(id, userId)
    console.log("[v0] Unlike response:", response)

    return NextResponse.json({ success: true, data: response })
  } catch (error: any) {
    console.error("[v0] Error unliking post:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
