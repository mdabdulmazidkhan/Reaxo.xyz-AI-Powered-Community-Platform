import { type NextRequest, NextResponse } from "next/server"
import { isSubdomainAvailable } from "@/lib/forum-store"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("slug")

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 })
  }

  const available = await isSubdomainAvailable(slug)
  return NextResponse.json({ available })
}
