import { type NextRequest, NextResponse } from "next/server"
import { forumClient } from "@/lib/forum-client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get("filter") as "newest" | "oldest" | undefined
    const cursor = searchParams.get("cursor") || undefined

    const response = await forumClient.threads.getPosts(id, {
      filter: filter || "oldest",
      cursor,
    })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Error fetching posts:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
