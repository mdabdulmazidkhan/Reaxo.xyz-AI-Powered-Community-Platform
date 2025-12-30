"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Bookmark,
  Share2,
  Flag,
  Eye,
  Heart,
  MessageSquare,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash,
  Bot,
  ImageIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PostCard } from "@/components/post-card"
import { formatDate, formatNumber } from "@/lib/forum-client"
import { cn } from "@/lib/utils"
import type { Thread, Post } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import useSWR, { useSWRConfig } from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Helper functions for AI mention detection
function contentMentionsAI(content: string): boolean {
  return content.toLowerCase().includes("@ai")
}

function contentMentionsImage(content: string): boolean {
  return content.toLowerCase().includes("@image")
}

interface ThreadDetailProps {
  threadId: string
}

interface ThreadResponse {
  thread: Thread & { replies?: Post[] }
}

export function ThreadDetail({ threadId }: ThreadDetailProps) {
  const { user, token } = useAuth()
  const router = useRouter()
  const { mutate: globalMutate } = useSWRConfig()
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [aiResponding, setAiResponding] = useState(false)

  const {
    data: response,
    error: threadError,
    isLoading: threadLoading,
    mutate: mutateThread,
  } = useSWR<ThreadResponse>(`/api/threads/${threadId}`, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  const thread = response?.thread
  const displayPosts = thread?.replies || []

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

      await mutateThread()
    } catch (err) {
      console.error("Error getting AI response:", err)
    } finally {
      setAiResponding(false)
    }
  }

  const triggerImageGeneration = async (replyContent: string, parentPostId?: string) => {
    if (!thread) return

    try {
      setAiResponding(true)
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

      await mutateThread()
    } catch (err) {
      console.error("Error generating image:", err)
    } finally {
      setAiResponding(false)
    }
  }

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !thread) return

    if (!user) {
      setError("Please log in to reply")
      return
    }

    if (replyContent.trim().length < 10) {
      setError("Reply must be at least 10 characters")
      return
    }

    setSubmitting(true)
    setError("")

    const mentionsAI = contentMentionsAI(replyContent)
    const mentionsImage = contentMentionsImage(replyContent)
    const savedReplyContent = replyContent

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          threadId: thread.id,
          body: replyContent,
          userId: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to post reply")
      }

      const newPostData = await res.json()
      const newReplyId = newPostData.post?.id

      setReplyContent("")

      await mutateThread(
        (currentData) => {
          if (!currentData?.thread) return currentData
          const newPost = newPostData.post || {
            id: Date.now().toString(),
            body: replyContent,
            createdAt: new Date().toISOString(),
            user: {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              avatar: user.avatar,
            },
            extendedData: {
              authorUsername: user.username,
              authorDisplayName: user.displayName,
              authorAvatar: user.avatar,
            },
          }
          return {
            ...currentData,
            thread: {
              ...currentData.thread,
              replies: [...(currentData.thread.replies || []), newPost],
              postCount: (currentData.thread.postCount || 0) + 1,
            },
          }
        },
        { revalidate: true },
      )

      globalMutate((key) => typeof key === "string" && key.startsWith("/api/threads"), undefined, { revalidate: true })

      if (mentionsImage) {
        await triggerImageGeneration(savedReplyContent, newReplyId)
      } else if (mentionsAI) {
        await triggerAIResponse(savedReplyContent, newReplyId)
      }
    } catch (err: any) {
      console.error("Error posting reply:", err)
      setError(err.message || "Failed to post reply")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteThread = async () => {
    if (!user) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/threads/${threadId}?userId=${user.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.push("/")
      }
    } catch (err) {
      console.error("Error deleting thread:", err)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    await mutateThread(
      (currentData) => {
        if (!currentData?.thread) return currentData
        return {
          ...currentData,
          thread: {
            ...currentData.thread,
            replies: (currentData.thread.replies || []).filter((p) => p.id !== postId),
          },
        }
      },
      { revalidate: true },
    )
  }

  const handleUpdatePost = async (postId: string, newContent: string) => {
    await mutateThread(
      (currentData) => {
        if (!currentData?.thread) return currentData
        return {
          ...currentData,
          thread: {
            ...currentData.thread,
            replies: (currentData.thread.replies || []).map((p) =>
              p.id === postId
                ? { ...p, body: newContent, extendedData: { ...p.extendedData, richContent: newContent } }
                : p,
            ),
          },
        }
      },
      { revalidate: true },
    )
  }

  // Loading state
  if (threadLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error state
  if (threadError || !thread) {
    return (
      <div className="space-y-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to threads
          </Button>
        </Link>
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">Thread not found or failed to load.</p>
        </div>
      </div>
    )
  }

  const apiAuthor = thread.author || thread.user || {}
  const author = {
    displayName: thread.extendedData?.authorDisplayName || apiAuthor.displayName || apiAuthor.username || "Anonymous",
    username: thread.extendedData?.authorUsername || apiAuthor.username || "anonymous",
    avatar: thread.extendedData?.authorAvatar || apiAuthor.avatar || null,
    id: thread.extendedData?.authorId || apiAuthor.id || thread.userId,
    roles: apiAuthor.roles || [],
  }
  const tags = thread.tags || []
  const isAdmin = author.roles?.some((r: any) => r.name?.toLowerCase() === "admin")
  const isOwner = user?.id === author.id

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to threads
        </Button>
      </Link>

      {/* Thread Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        {/* Author */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/user/${author.username}`} className="hover:opacity-80 transition-opacity">
              <Avatar className="h-12 w-12">
                <AvatarImage src={author.avatar || undefined} alt={author.displayName} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {author.displayName?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/user/${author.username}`}
                  className="font-medium hover:text-primary hover:underline transition-colors"
                >
                  {author.displayName}
                </Link>
                {author.username && author.displayName !== author.username && (
                  <Link
                    href={`/user/${author.username}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    @{author.username}
                  </Link>
                )}
                {isAdmin && (
                  <Badge variant="default" className="rounded-full px-1.5 py-0 text-[10px]">
                    Admin
                  </Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">Posted {formatDate(thread.createdAt)}</span>
            </div>
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/thread/${threadId}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Title */}
        <h1 className="mb-4 text-2xl font-bold leading-tight">{thread.title}</h1>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {tags.map((tag: any) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="rounded-full px-3 py-1"
                style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : undefined}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="prose prose-invert max-w-none mb-6">
          {thread.extendedData?.richContent ? (
            <div
              className="text-foreground/90 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: thread.extendedData.richContent }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
              {thread.body?.split("```").map((part: string, index: number) => {
                if (index % 2 === 1) {
                  const [, ...code] = part.split("\n")
                  return (
                    <pre key={index} className="rounded-lg bg-muted p-4 overflow-x-auto my-4">
                      <code className="text-xs font-mono">{code.join("\n")}</code>
                    </pre>
                  )
                }
                return (
                  <span key={index}>
                    {part.split("**").map((text, i) => (i % 2 === 1 ? <strong key={i}>{text}</strong> : text))}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Stats & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {formatNumber(thread.viewCount || thread.views || 0)} views
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              {thread.postCount || displayPosts.length} replies
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLiked(!liked)}
              className={cn("gap-1.5 rounded-full", liked && "text-red-500 hover:text-red-500")}
            >
              <Heart className={cn("h-4 w-4", liked && "fill-current")} />
              {formatNumber(liked ? (thread.likeCount || 0) + 1 : thread.likeCount || 0)}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBookmarked(!bookmarked)}
              className={cn("gap-1.5 rounded-full", bookmarked && "text-primary")}
            >
              <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
              Save
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 rounded-full">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 rounded-full text-muted-foreground">
              <Flag className="h-4 w-4" />
              Report
            </Button>
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {user ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar || undefined} alt={user.displayName || user.username} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {(user.displayName || user.username)?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">Reply as {user.displayName || user.username}</span>
          </div>
          <Textarea
            placeholder="Write your reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="mb-3 min-h-[100px] resize-none"
          />
          <div className="mb-3 text-xs text-muted-foreground flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Bot className="h-3 w-3" />
              <code className="bg-muted px-1 rounded">@ai</code> for chat
            </span>
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              <code className="bg-muted px-1 rounded">@image</code> to generate images
            </span>
          </div>
          {error && <p className="text-sm text-destructive mb-3">{error}</p>}
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{replyContent.length} / 10 minimum characters</span>
            <Button
              onClick={handleSubmitReply}
              disabled={!replyContent.trim() || replyContent.trim().length < 10 || submitting || aiResponding}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : aiResponding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI is responding...
                </>
              ) : (
                "Post Reply"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-muted-foreground mb-3">Log in to reply to this thread</p>
          <Link href="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      )}

      {aiResponding && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-primary">AI is generating a response...</span>
        </div>
      )}

      {/* Replies */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">{displayPosts.length} Replies</h3>

        {displayPosts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">No replies yet. Be the first to respond!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayPosts.map((post: Post) => (
              <PostCard
                key={post.id}
                post={post}
                isReply={!!post.parentId}
                onDelete={handleDeletePost}
                onUpdate={handleUpdatePost}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this thread? This action cannot be undone and all replies will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteThread}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
