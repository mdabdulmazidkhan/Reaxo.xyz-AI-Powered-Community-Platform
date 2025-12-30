import { type NextRequest, NextResponse } from "next/server"
import { forumClient } from "@/lib/forum-client"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const type = (searchParams.get("type") as "threads" | "posts" | "users" | "tags") || "threads"
    const cursor = searchParams.get("cursor") || undefined

    if (!query) {
      return NextResponse.json({ data: [], cursor: null })
    }

    const response = await forumClient.search.search({ query, type, cursor })
    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Error searching:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
