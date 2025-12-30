import { NextResponse } from "next/server"
import { forumClient } from "@/lib/forum-client"

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params
    const decodedUsername = decodeURIComponent(username)

    console.log("[v0] User profile API called for username:", decodedUsername)

    // Fetch all threads to find user's content
    const allThreadsResponse = await forumClient.threads.list({ limit: 500 })
    const allThreads = Array.isArray(allThreadsResponse)
      ? allThreadsResponse
      : allThreadsResponse.data || allThreadsResponse.threads || []

    console.log("[v0] Total threads fetched:", allThreads.length)

    // Filter threads by this user - check multiple possible locations for username
    const userThreads = allThreads.filter((thread: any) => {
      const possibleUsernames = [
        thread.extendedData?.authorUsername,
        thread.user?.username,
        thread.author?.username,
        thread.username,
      ]
        .filter(Boolean)
        .map((u: string) => u.toLowerCase())

      const matches = possibleUsernames.includes(decodedUsername.toLowerCase())
      if (matches) {
        console.log("[v0] Found matching thread:", thread.id, "usernames:", possibleUsernames)
      }
      return matches
    })

    console.log("[v0] User threads found:", userThreads.length)

    // Get user info from the first thread or construct from username
    let userInfo: any = null
    if (userThreads.length > 0) {
      const firstThread = userThreads[0]
      userInfo = {
        username: firstThread.extendedData?.authorUsername || firstThread.user?.username || decodedUsername,
        displayName: firstThread.extendedData?.authorDisplayName || firstThread.user?.displayName || decodedUsername,
        avatar: firstThread.extendedData?.authorAvatar || firstThread.user?.avatar || null,
        id: firstThread.extendedData?.authorId || firstThread.userId,
        bio: firstThread.user?.bio || null,
        joinedAt: firstThread.user?.createdAt || null,
      }
      console.log("[v0] User info constructed:", userInfo)
    } else {
      // User exists but has no threads - still return basic info
      userInfo = {
        username: decodedUsername,
        displayName: decodedUsername,
        avatar: null,
        id: null,
        bio: null,
        joinedAt: null,
      }
      console.log("[v0] No threads found, using default user info")
    }

    // Calculate stats
    const totalLikes = userThreads.reduce((sum: number, thread: any) => {
      const likes =
        typeof thread.likeCount === "number" ? thread.likeCount : typeof thread.likes === "number" ? thread.likes : 0
      return sum + likes
    }, 0)

    // Get replies by fetching posts from all threads
    const replies: any[] = []
    for (const thread of allThreads.slice(0, 50)) {
      // Limit to avoid too many API calls
      try {
        const postsResponse = await forumClient.threads.getPosts(thread.id)
        const posts = Array.isArray(postsResponse) ? postsResponse : postsResponse.data || postsResponse.posts || []

        for (const post of posts) {
          const postUsername = post.extendedData?.authorUsername || post.user?.username || post.author?.username
          if (postUsername?.toLowerCase() === decodedUsername.toLowerCase()) {
            replies.push({
              ...post,
              threadId: thread.id,
              threadTitle: thread.title,
            })
          }
        }
      } catch (e) {
        // Ignore errors fetching individual thread posts
      }
    }

    console.log("[v0] User replies found:", replies.length)

    return NextResponse.json({
      user: userInfo,
      threads: userThreads,
      replies,
      stats: {
        totalPosts: userThreads.length,
        totalLikes,
        totalReplies: replies.length,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching user profile:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
