import { type NextRequest, NextResponse } from "next/server"
import { joinForum, getForumById, isMember, leaveForum } from "@/lib/forum-store"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const forum = await getForumById(id)
    if (!forum) {
      return NextResponse.json({ error: "Forum not found" }, { status: 404 })
    }

    // Check if forum is private
    if (!forum.isPublic) {
      return NextResponse.json({ error: "This forum is private" }, { status: 403 })
    }

    if (await isMember(userId, id)) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 })
    }

    const member = await joinForum(userId, id)
    if (!member) {
      return NextResponse.json({ error: "Failed to join forum" }, { status: 500 })
    }

    return NextResponse.json({ data: member }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to join forum" }, { status: 500 })
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

    const success = await leaveForum(userId, id)

    if (!success) {
      return NextResponse.json({ error: "Failed to leave forum or you are the owner" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to leave forum" }, { status: 500 })
  }
}
