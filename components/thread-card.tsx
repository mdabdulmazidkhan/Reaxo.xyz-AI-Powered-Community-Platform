"use client"

import { useState, useEffect } from "react"
import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { MessageSquare, Eye, Heart, Pin, Lock, MoreHorizontal, Edit, Trash, Loader2, Bookmark } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"
import type { Thread, Forum } from "@/lib/types"
import { formatDate, formatNumber } from "@/lib/forum-client"
import { useAuth } from "@/lib/auth-context"

interface ThreadCardProps {
  thread: Thread & {
    forum?: Forum | null
    forumSlug?: string
    forumId?: string | null
    extendedData?: {
      richContent?: string
      forumId?: string
      forumSlug?: string
      forumName?: string
      authorUsername?: string
      authorDisplayName?: string
      authorAvatar?: string
      authorId?: string
    }
  }
  showForum?: boolean
  onDelete?: (threadId: string) => void
}

function extractFirstImage(html: string): string | null {
  if (!html) return null
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
  return imgMatch ? imgMatch[1] : null
}

function getPlainTextPreview(html: string, maxLength = 150): string {
  const stripped = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()

  if (stripped.length <= maxLength) return stripped
  return stripped.slice(0, maxLength).trim() + "..."
}

export function ThreadCard({ thread, showForum = true, onDelete }: ThreadCardProps) {
  const { user, token } = useAuth()
  const router = useRouter()

  const apiAuthor = thread.author || thread.user || {}
  const author = {
    displayName: thread.extendedData?.authorDisplayName || apiAuthor.displayName || apiAuthor.username || "Anonymous",
    username: thread.extendedData?.authorUsername || apiAuthor.username || "anonymous",
    avatar: thread.extendedData?.authorAvatar || apiAuthor.avatar || null,
    id: thread.extendedData?.authorId || apiAuthor.id || thread.userId,
  }

  const isOwner = user?.id === author.id

  const tags = thread.tags || []
  const replyCount = thread.postCount || 0
  const viewCount = thread.viewCount || 0

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(thread.likeCount || 0)
  const [liking, setLiking] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (user) {
      const savedPosts = localStorage.getItem(`saved-posts-${user.id}`)
      if (savedPosts) {
        const savedIds: string[] = JSON.parse(savedPosts)
        setIsSaved(savedIds.includes(thread.id))
      }
    }
  }, [user, thread.id])

  const forumSlug = thread.extendedData?.forumSlug || thread.forum?.slug || thread.forumSlug
  const forumName = thread.extendedData?.forumName || thread.forum?.name
  const forumIcon = thread.forum?.icon
  const hasForum = !!(thread.extendedData?.forumId || thread.forumId || thread.forum)

  const threadLink = forumSlug ? `/f/${forumSlug}/thread/${thread.id}` : `/thread/${thread.id}`

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user || liking) return

    try {
      setLiking(true)
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`

      if (liked) {
        await fetch(`/api/threads/${thread.id}/like?userId=${user.id}`, {
          method: "DELETE",
          headers,
        })
        setLiked(false)
        setLikeCount((prev) => Math.max(0, prev - 1))
      } else {
        await fetch(`/api/threads/${thread.id}/like`, {
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

  const handleDelete = async () => {
    if (!user) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/threads/${thread.id}?userId=${user.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        onDelete?.(thread.id)
      }
    } catch (err) {
      console.error("Error deleting thread:", err)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/thread/${thread.id}/edit`)
  }

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) return

    const storageKey = `saved-posts-${user.id}`
    const savedPosts = localStorage.getItem(storageKey)
    let savedIds: string[] = savedPosts ? JSON.parse(savedPosts) : []

    if (isSaved) {
      savedIds = savedIds.filter((id) => id !== thread.id)
      setIsSaved(false)
    } else {
      savedIds.push(thread.id)
      setIsSaved(true)
    }

    localStorage.setItem(storageKey, JSON.stringify(savedIds))
  }

  const contentPreview = getPlainTextPreview(thread.extendedData?.richContent || thread.body || "")
  const firstImage = extractFirstImage(thread.extendedData?.richContent || "")

  return (
    <>
      <article
        className={cn(
          "group relative rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:bg-card/80",
          thread.isPinned && "border-primary/30 bg-primary/5",
        )}
      >
        <div className="absolute right-4 top-4 flex gap-2">
          {thread.isPinned && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
              <Pin className="h-3 w-3 text-primary" />
            </div>
          )}
          {thread.isLocked && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.preventDefault()
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {showForum && hasForum && forumSlug && (
          <Link
            href={`/f/${forumSlug}`}
            className="inline-flex items-center gap-1.5 mb-3 text-xs font-medium text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {forumIcon ? (
              <Image
                src={forumIcon || "/placeholder.svg"}
                alt={forumName || forumSlug}
                width={20}
                height={20}
                className="rounded"
              />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-[10px] font-bold">
                {forumName?.[0] || forumSlug[0].toUpperCase()}
              </span>
            )}
            f/{forumSlug}
          </Link>
        )}

        <div className="mb-3 flex items-center gap-3">
          <Link
            href={`/user/${author.username}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={author.avatar || undefined} alt={author.displayName} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {author.displayName?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col text-sm">
            <Link
              href={`/user/${author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-medium hover:text-primary hover:underline transition-colors"
            >
              {author.displayName}
            </Link>
            {author.username && author.displayName !== author.username && (
              <Link
                href={`/user/${author.username}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                @{author.username}
              </Link>
            )}
          </div>
          <span className="text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">{formatDate(thread.createdAt)}</span>
        </div>

        <Link href={threadLink}>
          <h3 className="mb-2 text-lg font-semibold leading-tight group-hover:text-primary">{thread.title}</h3>
        </Link>

        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{contentPreview}</p>

        {firstImage && (
          <Link href={threadLink} className="block mb-4">
            <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted">
              <img
                src={firstImage || "/placeholder.svg"}
                alt="Post image"
                className="w-full max-h-[300px] object-cover hover:opacity-90 transition-opacity"
                loading="lazy"
              />
            </div>
          </Link>
        )}

        {tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="rounded-full px-2.5 py-0.5 text-xs font-normal"
                style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : undefined}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              {formatNumber(replyCount)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {formatNumber(viewCount)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-auto p-0 gap-1.5 hover:bg-transparent", liked && "text-red-500")}
              onClick={handleLike}
              disabled={liking}
            >
              <Heart className={cn("h-4 w-4", liked && "fill-current")} />
              {formatNumber(likeCount)}
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-auto p-0 gap-1.5 hover:bg-transparent", isSaved && "text-primary")}
                onClick={handleSave}
                title={isSaved ? "Remove from saved" : "Save post"}
              >
                <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
              </Button>
            )}
          </div>

          {thread.lastPost && (
            <div className="hidden items-center gap-2 sm:flex">
              <span>Last reply by</span>
              <Avatar className="h-5 w-5">
                <AvatarImage
                  src={thread.lastPost.author?.avatar || "/placeholder.svg?height=20&width=20&query=avatar"}
                  alt={thread.lastPost.author?.displayName || ""}
                />
                <AvatarFallback className="text-[10px]">
                  {thread.lastPost.author?.displayName?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <span>{formatDate(thread.lastPost.createdAt)}</span>
            </div>
          )}
        </div>
      </article>

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
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
