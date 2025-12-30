import { type NextRequest, NextResponse } from "next/server"
import { forumClient } from "@/lib/forum-client"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Number(searchParams.get("limit")) || 5

    // Fetch all threads to calculate likes per user
    const threadsResponse = await forumClient.threads.list({
      limit: 100, // Get more threads to aggregate
      filter: "newest",
    })

    let threads: any[] = []
    if (Array.isArray(threadsResponse)) {
      threads = threadsResponse
    } else if (threadsResponse && typeof threadsResponse === "object") {
      threads = (threadsResponse as any).threads || (threadsResponse as any).data || []
    }

    // Aggregate likes by user
    const userLikes: Map<
      string,
      {
        userId: string
        username: string
        displayName: string
        avatar: string | null
        totalLikes: number
        postCount: number
      }
    > = new Map()

    for (const thread of threads) {
      const userId = thread.userId || thread.user?.id
      const username = thread.user?.username || thread.extendedData?.authorUsername || "unknown"
      const displayName = thread.user?.displayName || thread.extendedData?.authorDisplayName || username
      const avatar = thread.user?.avatar || thread.extendedData?.authorAvatar || null

      let likes = 0
      const rawLikes = thread.likeCount ?? thread.likes ?? 0
      if (typeof rawLikes === "number") {
        likes = rawLikes
      } else if (typeof rawLikes === "object" && rawLikes !== null) {
        // If it's an object, try to get count or length
        likes = rawLikes.count ?? rawLikes.total ?? Object.keys(rawLikes).length ?? 0
      } else if (typeof rawLikes === "string") {
        likes = Number.parseInt(rawLikes, 10) || 0
      }

      if (!userId || userId === "afb6c21c-34fd-4b9a-80e7-c833eedeb6e3") continue // Skip system user

      if (userLikes.has(userId)) {
        const existing = userLikes.get(userId)!
        existing.totalLikes += likes
        existing.postCount += 1
      } else {
        userLikes.set(userId, {
          userId,
          username,
          displayName,
          avatar,
          totalLikes: likes,
          postCount: 1,
        })
      }
    }

    // Sort by total likes and take top N
    const topContributors = Array.from(userLikes.values())
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, limit)

    return NextResponse.json({
      data: topContributors,
      total: topContributors.length,
    })
  } catch (error: any) {
    console.error("Error fetching top contributors:", error)
    return NextResponse.json({ error: error.message, data: [] }, { status: 500 })
  }
}
