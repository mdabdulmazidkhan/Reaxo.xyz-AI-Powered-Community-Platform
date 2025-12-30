import { type NextRequest, NextResponse } from "next/server"
import { forumClient } from "@/lib/forum-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, displayName } = body

    const user = await forumClient.auth.register({
      username,
      email,
      password,
      displayName,
    })

    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    console.error("Register error:", error)
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 400 })
  }
}
