import { type NextRequest, NextResponse } from "next/server"
import { forumClient } from "@/lib/forum-client"

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

const SYSTEM_USER_ID = "afb6c21c-34fd-4b9a-80e7-c833eedeb6e3"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()

    console.log("[v0] Creating reply for thread:", id, "body:", JSON.stringify(body).substring(0, 100))

    const plainTextBody = stripHtml(body.body || "")
    const finalBody = plainTextBody.length < 10 ? plainTextBody.padEnd(10, " ") : plainTextBody

    console.log("[v0] Using system user ID:", SYSTEM_USER_ID)

    const createPayload: any = {
      threadId: id,
      body: finalBody,
      userId: SYSTEM_USER_ID,
      extendedData: {
        richContent: body.body,
      },
    }

    // Add parentId if this is a reply to another comment
    if (body.parentId) {
      createPayload.parentId = body.parentId
      console.log("[v0] This is a nested reply to parent:", body.parentId)
    }

    const response = await forumClient.posts.create(createPayload)

    console.log("[v0] Reply created successfully:", response.id)
    return NextResponse.json({ reply: response })
  } catch (error: any) {
    console.error("[v0] Error creating reply:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
