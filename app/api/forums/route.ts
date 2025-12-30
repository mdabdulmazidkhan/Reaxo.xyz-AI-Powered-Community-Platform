import { type NextRequest, NextResponse } from "next/server"
import { getForums, getForumsByOwner, getPublicForums, createForum, isSlugAvailable } from "@/lib/forum-store"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ownerId = searchParams.get("ownerId")
  const publicOnly = searchParams.get("public") === "true"

  if (ownerId) {
    const forums = await getForumsByOwner(ownerId)
    return NextResponse.json({ data: forums })
  }

  const forums = publicOnly ? await getPublicForums() : await getForums()
  return NextResponse.json({ data: forums })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, description, isPublic, ownerId, icon, settings } = body

    console.log("[v0] Creating forum with data:", JSON.stringify({ name, slug, ownerId, isPublic }))

    if (!name || !slug || !ownerId) {
      return NextResponse.json({ error: "Name, slug, and ownerId are required" }, { status: 400 })
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "URL slug can only contain lowercase letters, numbers, and hyphens" },
        { status: 400 },
      )
    }

    if (!(await isSlugAvailable(slug))) {
      return NextResponse.json({ error: "This URL is already taken" }, { status: 400 })
    }

    const forum = await createForum({
      name,
      slug,
      description: description || "",
      isPublic: isPublic ?? true,
      ownerId,
      icon,
      settings,
    })

    console.log("[v0] Forum created successfully:", JSON.stringify(forum))

    return NextResponse.json({ data: forum }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating forum:", error)
    return NextResponse.json({ error: "Failed to create forum" }, { status: 500 })
  }
}
