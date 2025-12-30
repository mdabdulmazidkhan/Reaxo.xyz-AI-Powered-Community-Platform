import { type NextRequest, NextResponse } from "next/server"
import { forumStore } from "@/lib/forum-store"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { id, userId } = await params
  const body = await request.json()

  const member = forumStore.updateMemberRole ? await forumStore.updateMemberRole(id, userId, body.role) : null
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }

  return NextResponse.json(member)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { id, userId } = await params

  const success = forumStore.removeMember ? await forumStore.removeMember(id, userId) : false
  if (!success) {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
