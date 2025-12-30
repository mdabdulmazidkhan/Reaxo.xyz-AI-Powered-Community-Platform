"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Heart, MessageSquare, Share2, MoreVertical, Loader2, Bot, ImageIcon, Reply } from "lucide-react"
import { ForumHeader } from "./forum-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { Forum } from "@/lib/types"
import Link from "next/link"
import { formatDate } from "@/lib/forum-client"
import { useAuth } from "@/lib/auth-context"
import { RichTextViewer } from "@/components/editor/rich-text-viewer"
import { RichTextEditor } from "@/components/editor/rich-text-editor"

interface ForumThreadDetailProps {
  forum: Forum
  threadId: string
}

interface Thread {
  id: string
  title: string
  slug: string
  body: string
  views: number
  userId: string
  locked: boolean
  pinned: boolean
  createdAt: string
  updatedAt: string
  user?: {
    username: string
    avatarUrl?: string
  }
  replies?: NestedReply[]
  _count?: {
    replies: number
    reactions: number
  }
  extendedData?: {
    richContent?: string
    forumId?: string
  }
}

interface NestedReply {
  id: string
  body: string
  parentId?: string
  createdAt: string
  user?: {
    username: string
    avatarUrl?: string
    displayName?: string
  }
  _count?: {
    reactions: number
  }
  extendedData?: {
    richContent?: string
    isAiResponse?: boolean
    generatedImage?: string
  }
  children?: NestedReply[]
}

function contentMentionsAI(content: string): boolean {
  return content.includes('data-id="ai"') || content.includes("@ai")
}

function contentMentionsImage(content: string): boolean {
  return content.includes('data-id="image"') || content.includes("@image")
}

function isAIUser(username?: string): boolean {
  return username?.toLowerCase() === "ai_assistant" || username?.toLowerCase() === "ai"
}

function buildReplyTree(replies: NestedReply[]): NestedReply[] {
  const replyMap = new Map<string, NestedReply>()
  const rootReplies: NestedReply[] = []

  replies.forEach((reply) => {
    replyMap.set(reply.id, { ...reply, children: [] })
  })

  replies.forEach((reply) => {
    const replyWithChildren = replyMap.get(reply.id)!
    if (reply.parentId && replyMap.has(reply.parentId)) {
      const parent = replyMap.get(reply.parentId)!
      parent.children = parent.children || []
      parent.children.push(replyWithChildren)
    } else {
      rootReplies.push(replyWithChildren)
    }
  })

  return rootReplies
}

export function ForumThreadDetail({ forum, threadId }: ForumThreadDetailProps) {
  const { user, token } = useAuth()
  const [thread, setThread] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [liking, setLiking] = useState(false)
  const [aiResponding, setAiResponding] = useState(false)
  const [imageGenerating, setImageGenerating] = useState(false)
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null)

  const fetchThread = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/threads/${threadId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch thread")
      }

      const threadData = data.thread || data
      setThread(threadData)
      setLikeCount(threadData._count?.reactions || 0)
    } catch (err) {
      console.error("[v0] Error fetching thread:", err)
      setError(err instanceof Error ? err.message : "Failed to load thread")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchThread()
  }, [threadId])

  const handleLike = async () => {
    if (!user || liking) return

    try {
      setLiking(true)
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`

      if (liked) {
        await fetch(`/api/threads/${threadId}/like?userId=${user.id}`, {
          method: "DELETE",
          headers,
        })
        setLiked(false)
        setLikeCount((prev) => Math.max(0, prev - 1))
      } else {
        await fetch(`/api/threads/${threadId}/like`, {
          method: "POST",
          headers,
          body: JSON.stringify({ userId: user.id }),
        })
        setLiked(true)
        setLikeCount((prev) => prev + 1)
      }
    } catch (err) {
      console.error("[v0] Error toggling like:", err)
    } finally {
      setLiking(false)
    }
  }

  const triggerAIResponse = async (replyContent: string, parentPostId?: string) => {
    if (!thread) return

    try {
      setAiResponding(true)
      const response = await fetch("/api/ai/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: thread.id,
          threadTitle: thread.title,
          threadBody: thread.extendedData?.richContent || thread.body,
          replyContent,
          mentionedBy: user?.username || "Anonymous",
          parentPostId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to get AI response")
      }

      await fetchThread()
    } catch (err) {
      console.error("[v0] Error getting AI response:", err)
    } finally {
      setAiResponding(false)
    }
  }

  const triggerImageGeneration = async (replyContent: string, parentPostId?: string) => {
    if (!thread) return

    try {
      setImageGenerating(true)
      const response = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: thread.id,
          threadTitle: thread.title,
          threadBody: thread.extendedData?.richContent || thread.body,
          replyContent,
          mentionedBy: user?.username || "Anonymous",
          parentPostId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to generate image")
      }

      await fetchThread()
    } catch (err) {
      console.error("[v0] Error generating image:", err)
    } finally {
      setImageGenerating(false)
    }
  }

  const handleSubmitReply = async () => {
    const strippedContent = replyBody.replace(/<[^>]*>/g, "").trim()
    if (!strippedContent || strippedContent.length < 10) {
      alert("Reply must be at least 10 characters")
      return
    }

    if (!user) {
      alert("Please log in to reply")
      return
    }

    try {
      setSubmitting(true)
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const requestBody: any = { body: replyBody }
      if (replyingTo) {
        requestBody.parentId = replyingTo.id
      }

      const response = await fetch(`/api/threads/${threadId}/replies`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to post reply")
      }

      const mentionsAI = contentMentionsAI(replyBody)
      const mentionsImage = contentMentionsImage(replyBody)
      const savedReplyBody = replyBody
      const newReplyId = data.reply?.id

      await fetchThread()
      setReplyBody("")
      setReplyingTo(null)

      if (mentionsImage) {
        await triggerImageGeneration(savedReplyBody, newReplyId)
      } else if (mentionsAI) {
        await triggerAIResponse(savedReplyBody, newReplyId)
      }
    } catch (err) {
      console.error("[v0] Error posting reply:", err)
      alert(err instanceof Error ? err.message : "Failed to post reply")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReplyToComment = (replyId: string, username: string) => {
    setReplyingTo({ id: replyId, username })
    document.getElementById("reply-box")?.scrollIntoView({ behavior: "smooth" })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ForumHeader forum={forum} />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen bg-background">
        <ForumHeader forum={forum} />
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link
            href={`/f/${forum.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {forum.name}
          </Link>
          <Card className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Thread Not Found</h2>
            <p className="text-muted-foreground">{error || "This thread doesn't exist or has been deleted."}</p>
          </Card>
        </div>
      </div>
    )
  }

  const nestedReplies = thread.replies ? buildReplyTree(thread.replies) : []

  return (
    <div className="min-h-screen bg-background">
      <ForumHeader forum={forum} />

      <div className="mx-auto max-w-4xl px-4 py-6">
        <Link
          href={`/f/${forum.slug}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {forum.name}
        </Link>

        <Card className="p-6 mb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={thread.user?.avatarUrl || "/placeholder.svg?height=48&width=48&query=user avatar"}
                alt={thread.user?.username || "User"}
              />
              <AvatarFallback>{(thread.user?.username || "U")[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {thread.pinned && <Badge variant="secondary">Pinned</Badge>}
                {thread.locked && <Badge variant="outline">Locked</Badge>}
              </div>
              <h1 className="text-2xl font-bold mb-2">{thread.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{thread.user?.username || "Anonymous"}</span>
                <span>·</span>
                <span>{formatDate(thread.createdAt)}</span>
                <span>·</span>
                <span>{thread.views} views</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <RichTextViewer content={thread.extendedData?.richContent || thread.body} />
          </div>

          <div className="flex items-center gap-2 mt-6 pt-4 border-t">
            <Button
              variant={liked ? "default" : "ghost"}
              size="sm"
              className="gap-2"
              onClick={handleLike}
              disabled={!user || liking}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {likeCount}
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              {thread.replies?.length || thread._count?.replies || 0} replies
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="ghost" size="icon" className="ml-auto">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {!thread.locked && (
          <Card className="p-4 mb-4" id="reply-box">
            {user ? (
              <>
                {replyingTo && (
                  <div className="flex items-center gap-2 mb-3 p-2 bg-muted rounded-md">
                    <Reply className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Replying to <strong>{replyingTo.username}</strong>
                    </span>
                    <Button variant="ghost" size="sm" className="ml-auto h-6 px-2" onClick={() => setReplyingTo(null)}>
                      Cancel
                    </Button>
                  </div>
                )}
                <RichTextEditor
                  content={replyBody}
                  onChange={setReplyBody}
                  placeholder={
                    replyingTo
                      ? `Reply to ${replyingTo.username}...`
                      : "Write your reply... Type @ to mention users, @ai for AI chat, or @image to generate images!"
                  }
                  className="mb-3"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Tip: <span className="font-mono bg-muted px-1 rounded">@ai</span> for chat,{" "}
                    <span className="font-mono bg-muted px-1 rounded">@image</span> to generate images
                  </p>
                  <Button
                    onClick={handleSubmitReply}
                    disabled={
                      submitting ||
                      aiResponding ||
                      imageGenerating ||
                      replyBody.replace(/<[^>]*>/g, "").trim().length < 10
                    }
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Posting...
                      </>
                    ) : aiResponding ? (
                      <>
                        <Bot className="h-4 w-4 animate-pulse mr-2" />
                        AI Responding...
                      </>
                    ) : imageGenerating ? (
                      <>
                        <ImageIcon className="h-4 w-4 animate-pulse mr-2" />
                        Generating Image...
                      </>
                    ) : (
                      "Post Reply"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-2">Log in to join the conversation</p>
                <Button asChild variant="outline">
                  <Link href="/login">Log In</Link>
                </Button>
              </div>
            )}
          </Card>
        )}

        {imageGenerating && (
          <Card className="p-4 mb-4 border-purple-500/50 bg-purple-500/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-purple-500 animate-pulse" />
              </div>
              <div>
                <p className="font-medium">Image AI is creating your image...</p>
                <p className="text-sm text-muted-foreground">This may take a few seconds</p>
              </div>
            </div>
          </Card>
        )}

        {aiResponding && (
          <Card className="p-4 mb-4 border-primary/50 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div>
                <p className="font-medium">AI Assistant is typing...</p>
                <p className="text-sm text-muted-foreground">Analyzing the conversation and preparing a response</p>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          <h2 className="font-semibold">{thread.replies?.length || 0} Replies</h2>
          {nestedReplies.length > 0 ? (
            nestedReplies.map((reply) => (
              <ReplyCard
                key={reply.id}
                reply={reply}
                user={user}
                token={token}
                isAI={isAIUser(reply.user?.username)}
                onReply={handleReplyToComment}
                depth={0}
              />
            ))
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No replies yet. Be the first to reply!</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ReplyCard({
  reply,
  user,
  token,
  isAI,
  onReply,
  depth = 0,
}: {
  reply: NestedReply
  user: any
  token: string | null
  isAI?: boolean
  onReply: (replyId: string, username: string) => void
  depth?: number
}) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(reply._count?.reactions || 0)
  const [liking, setLiking] = useState(false)

  const isAIResponse = isAI || reply.extendedData?.isAiResponse

  const handleLike = async () => {
    if (!user || liking) return

    try {
      setLiking(true)
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`

      if (liked) {
        await fetch(`/api/posts/${reply.id}/like?userId=${user.id}`, {
          method: "DELETE",
          headers,
        })
        setLiked(false)
        setLikeCount((prev) => Math.max(0, prev - 1))
      } else {
        await fetch(`/api/posts/${reply.id}/like`, {
          method: "POST",
          headers,
          body: JSON.stringify({ userId: user.id }),
        })
        setLiked(true)
        setLikeCount((prev) => prev + 1)
      }
    } catch (err) {
      console.error("[v0] Error toggling like:", err)
    } finally {
      setLiking(false)
    }
  }

  const displayContent = reply.extendedData?.richContent || reply.body
  const displayName = isAIResponse ? "Reaxo AI" : reply.user?.displayName || reply.user?.username || "Anonymous"
  const username = isAIResponse ? "ai" : reply.user?.username || "anonymous"

  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-muted pl-4" : ""}>
      <Card className={`p-4 ${isAIResponse ? "border-primary/30 bg-primary/5" : ""}`}>
        <div className="flex gap-4">
          {isAIResponse ? (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src="/reaxo-logo.png" alt="Reaxo AI" className="h-10 w-10 object-cover" />
            </div>
          ) : (
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={reply.user?.avatarUrl || "/placeholder.svg?height=40&width=40&query=user avatar"}
                alt={displayName}
              />
              <AvatarFallback>{displayName[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">{displayName}</span>
              {!isAIResponse && username && <span className="text-sm text-muted-foreground">@{username}</span>}
            </div>
            <RichTextViewer content={displayContent} />
            {reply.extendedData?.generatedImage && (
              <div className="mt-3">
                <img
                  src={reply.extendedData.generatedImage || "/placeholder.svg"}
                  alt="AI Generated Image"
                  className="max-w-full rounded-lg border"
                />
              </div>
            )}
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant={liked ? "default" : "ghost"}
                size="sm"
                className="gap-1 h-8"
                onClick={handleLike}
                disabled={!user || liking}
              >
                <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
                {likeCount}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 h-8"
                onClick={() => onReply(reply.id, username)}
                disabled={!user}
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {reply.children && reply.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {reply.children.map((child) => (
            <ReplyCard
              key={child.id}
              reply={child}
              user={user}
              token={token}
              isAI={isAIUser(child.user?.username)}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
