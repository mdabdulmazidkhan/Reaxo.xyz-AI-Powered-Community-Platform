import { type NextRequest, NextResponse } from "next/server"
import { getForumById, updateForum, deleteForum } from "@/lib/forum-store"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const forum = await getForumById(id)

  if (!forum) {
    return NextResponse.json({ error: "Forum not found" }, { status: 404 })
  }

  return NextResponse.json(forum)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const existingForum = await getForumById(id)
    if (!existingForum) {
      return NextResponse.json({ error: "Forum not found" }, { status: 404 })
    }

    const updates = {
      ...body,
      settings: body.settings ? { ...existingForum.settings, ...body.settings } : existingForum.settings,
    }

    const forum = await updateForum(id, updates)

    return NextResponse.json(forum)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update forum" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deleted = await deleteForum(id)

  if (!deleted) {
    return NextResponse.json({ error: "Forum not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
