import { type NextRequest, NextResponse } from "next/server"
import { isSubdomainAvailable } from "@/lib/forum-store"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get("subdomain")

  if (!subdomain) {
    return NextResponse.json({ error: "Subdomain is required" }, { status: 400 })
  }

  const available = await isSubdomainAvailable(subdomain)
  return NextResponse.json({ available })
}
