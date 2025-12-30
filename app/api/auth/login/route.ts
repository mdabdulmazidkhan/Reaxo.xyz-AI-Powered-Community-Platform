import { type NextRequest, NextResponse } from "next/server"
import { forumClient } from "@/lib/forum-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { login, password } = body

    // Login to get token
    const loginRes = await forumClient.auth.login({ login, password })

    // Set token to fetch user details
    forumClient.setToken(loginRes.token)
    const user = await forumClient.auth.me()

    return NextResponse.json({
      token: loginRes.token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 401 })
  }
}
