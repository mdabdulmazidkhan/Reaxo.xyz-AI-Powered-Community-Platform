import { type NextRequest, NextResponse } from "next/server"
import { forumClient } from "@/lib/forum-client"
import { forumStore } from "@/lib/forum-store"

function stripHtml(html: string): string {
  return html
    .replace(/<img[^>]*>/gi, "[image]")
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "[video]")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

const SYSTEM_USER_ID = "afb6c21c-34fd-4b9a-80e7-c833eedeb6e3"
const SYSTEM_USERNAME = "system_user"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get("filter") as "newest" | "oldest" | undefined
    const tagId = searchParams.get("tagId") || undefined
    const limit = Number(searchParams.get("limit")) || 10
    const cursor = searchParams.get("cursor") || undefined
    const forumId = searchParams.get("forumId") || undefined

    console.log("[v0] Fetching threads with params:", { filter, limit, forumId })

    const response = await forumClient.threads.list({
      limit,
      filter: filter || "newest",
      tagId,
      cursor,
    })

    console.log("[v0] Raw API response type:", typeof response, Array.isArray(response))

    let threads: any[] = []
    let cursorValue: string | null = null
    let hasMore = false

    if (Array.isArray(response)) {
      threads = response
    } else if (response && typeof response === "object") {
      threads = (response as any).threads || (response as any).data || []
      cursorValue = (response as any).cursor || (response as any).nextCursor || null
      hasMore = (response as any).hasMore || threads.length === limit
    }

    console.log("[v0] Parsed threads count:", threads.length)

    threads = threads.filter((thread: any) => {
      const userId = thread.userId || thread.user?.id
      const username = thread.user?.username || thread.author?.username
      return userId !== SYSTEM_USER_ID && username !== SYSTEM_USERNAME
    })

    console.log("[v0] After filtering system user, count:", threads.length)

    const allForums = await forumStore.getForums()
    console.log("[v0] All forums count:", allForums.length)

    const threadsWithForum = threads.map((thread: any) => {
      const threadForumId = thread.extendedData?.forumId
      if (threadForumId) {
        const forum = allForums.find((f) => f.id === threadForumId)
        if (forum) {
          return { ...thread, forum, forumId: threadForumId }
        }
      }
      // No forum - this is a home feed post
      return { ...thread, forum: null, forumId: null }
    })

    let filteredThreads = threadsWithForum
    if (forumId) {
      filteredThreads = threadsWithForum.filter((t: any) => t.forumId === forumId)
      console.log("[v0] Filtered to forum:", forumId, "count:", filteredThreads.length)
    }

    console.log("[v0] Returning threads count:", filteredThreads.length)

    return NextResponse.json({
      data: filteredThreads,
      threads: filteredThreads,
      cursor: cursorValue,
      hasMore,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching threads:", error)
    return NextResponse.json({ error: error.message, data: [], threads: [] }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json()

    const title = reqBody.title?.trim()
    const htmlContent = (reqBody.content || reqBody.body || "")?.trim()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!htmlContent) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const plainTextBody = stripHtml(htmlContent)
    const finalBody = plainTextBody.length < 10 ? plainTextBody + " ".repeat(10 - plainTextBody.length) : plainTextBody

    const hasRichContent =
      htmlContent.includes("<img") ||
      htmlContent.includes("<iframe") ||
      htmlContent.includes("<pre") ||
      htmlContent.includes("<blockquote") ||
      htmlContent.includes("<strong") ||
      htmlContent.includes("<em") ||
      htmlContent.includes("<h1") ||
      htmlContent.includes("<h2") ||
      htmlContent.includes("<ul") ||
      htmlContent.includes("<ol")

    const userId = reqBody.userId || SYSTEM_USER_ID

    const payload: {
      title: string
      body: string
      userId: string
      tags?: string[]
      extendedData?: Record<string, any>
    } = {
      title,
      body: finalBody,
      userId,
    }

    const extendedData: Record<string, any> = {}

    if (hasRichContent) {
      extendedData.richContent = htmlContent
    }

    if (reqBody.username || reqBody.displayName || reqBody.avatar) {
      extendedData.authorUsername = reqBody.username
      extendedData.authorDisplayName = reqBody.displayName
      extendedData.authorAvatar = reqBody.avatar
    }

    if (reqBody.forumId && reqBody.forumId !== "homeFeed" && reqBody.forumId !== "undefined") {
      extendedData.forumId = reqBody.forumId

      const forum = await forumStore.getForumById(reqBody.forumId)
      if (forum) {
        extendedData.forumSlug = forum.slug
        extendedData.forumName = forum.name
        await forumStore.updateForum(reqBody.forumId, {
          threadCount: (forum.threadCount || 0) + 1,
        })
      }
    }
    // If no forumId or forumId is "homeFeed", don't add forumId to extendedData

    if (Object.keys(extendedData).length > 0) {
      payload.extendedData = extendedData
    }

    if (reqBody.tags && Array.isArray(reqBody.tags) && reqBody.tags.length > 0) {
      payload.tags = reqBody.tags
    }

    const response = await forumClient.threads.create(payload)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Error creating thread:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
