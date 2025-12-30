import { type NextRequest, NextResponse } from "next/server"
import { forumClient } from "@/lib/forum-client"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query") || undefined
    const cursor = searchParams.get("cursor") || undefined

    const response = await forumClient.tags.list({ query, cursor })
    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Error fetching tags:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await forumClient.tags.create(body)
    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Error creating tag:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
