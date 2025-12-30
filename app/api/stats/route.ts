import { NextResponse } from "next/server"
import { forumClient } from "@/lib/forum-client"

export async function GET() {
  try {
    const response = await forumClient.stats.get()
    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
