import { type NextRequest, NextResponse } from "next/server"
import { forumClient } from "@/lib/forum-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    if (!body.threadId) {
      return NextResponse.json({ error: "threadId is required" }, { status: 400 })
    }

    if (!body.body || body.body.trim().length < 10) {
      return NextResponse.json({ error: "Post body must be at least 10 characters" }, { status: 400 })
    }

    const payload: any = {
      body: body.body,
      threadId: body.threadId,
      userId: body.userId,
    }

    if (body.parentId) {
      payload.parentId = body.parentId
    }

    // Store author info for display
    const extendedData: Record<string, any> = {}
    if (body.username) extendedData.authorUsername = body.username
    if (body.displayName) extendedData.authorDisplayName = body.displayName
    if (body.avatar) extendedData.authorAvatar = body.avatar
    if (body.richContent) extendedData.richContent = body.richContent

    if (Object.keys(extendedData).length > 0) {
      payload.extendedData = extendedData
    }

    const response = await forumClient.posts.create(payload)
    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Error creating post:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
