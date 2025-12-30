import { type NextRequest, NextResponse } from "next/server"
import { getJoinedForums, getUserMemberships, getForumsByOwner } from "@/lib/forum-store"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  try {
    const joinedForums = await getJoinedForums(userId)
    const ownedForums = await getForumsByOwner(userId)
    const memberships = await getUserMemberships(userId)

    // Combine owned and joined forums (remove duplicates)
    const allForumsMap = new Map()

    ownedForums.forEach((forum) => {
      allForumsMap.set(forum.id, forum)
    })

    joinedForums.forEach((forum) => {
      if (!allForumsMap.has(forum.id)) {
        allForumsMap.set(forum.id, forum)
      }
    })

    const userForums = Array.from(allForumsMap.values())

    return NextResponse.json({
      forums: userForums,
      memberships,
    })
  } catch (error) {
    console.error("Error in memberships API:", error)
    return NextResponse.json({ error: "Failed to fetch memberships" }, { status: 500 })
  }
}
