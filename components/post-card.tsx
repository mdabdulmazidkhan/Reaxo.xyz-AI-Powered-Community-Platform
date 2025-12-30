"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart, Reply, MoreHorizontal, Edit, Trash, Loader2, X, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import { formatDate, formatNumber } from "@/lib/forum-client"
import type { Post } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

interface PostCardProps {
  post: Post
  isReply?: boolean
  onReply?: (postId: string) => void
  onDelete?: (postId: string) => void
  onUpdate?: (postId: string, newContent: string) => void
}

export function PostCard({ post, isReply = false, onReply, onDelete, onUpdate }: PostCardProps) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likeCount || 0)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.body || "")
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
  }

  const isAiResponse = post.extendedData?.isAiResponse === true
  const isImageAiResponse = post.extendedData?.isImageResponse === true

  const apiAuthor = post.author || post.user || {}
  const author = {
    displayName: isAiResponse
      ? isImageAiResponse
        ? "Image Generator"
        : "Reaxo AI"
      : post.extendedData?.authorDisplayName || apiAuthor.displayName || apiAuthor.username || "Anonymous",
    username: isAiResponse ? "ai" : post.extendedData?.authorUsername || apiAuthor.username || "anonymous",
    avatar: post.extendedData?.authorAvatar || apiAuthor.avatar || null,
    id: post.extendedData?.authorId || apiAuthor.id || post.userId,
    roles: apiAuthor.roles || [],
  }

  const isOwner = user?.id === author.id && !isAiResponse
  const isAdmin = author.roles?.some((r: any) => r.name?.toLowerCase() === "admin")
  const isMod = author.roles?.some((r: any) => r.name?.toLowerCase() === "moderator")

  const richContent = post.extendedData?.richContent
  const content = post.body || ""

  const handleEdit = () => {
    setEditContent(post.body || "")
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(post.body || "")
  }

  const handleSaveEdit = async () => {
    if (!user || !editContent.trim()) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent,
          userId: user.id,
          extendedData: {
            ...post.extendedData,
            richContent: editContent,
          },
        }),
      })

      if (res.ok) {
        setIsEditing(false)
        onUpdate?.(post.id, editContent)
      }
    } catch (err) {
      console.error("Error updating post:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}?userId=${user.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        onDelete?.(post.id)
      }
    } catch (err) {
      console.error("Error deleting post:", err)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const renderAuthorInfo = () => {
    const avatarElement = isAiResponse ? (
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
        <img src="/reaxo-logo.png" alt={author.displayName} className="h-10 w-10 object-cover" />
      </div>
    ) : (
      <Avatar className="h-10 w-10">
        <AvatarImage src={author.avatar || undefined} alt={author.displayName} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {author.displayName?.[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
    )

    const nameElement = (
      <div>
        <div className="flex items-center gap-2">
          <span className={cn("font-medium", !isAiResponse && "hover:text-primary hover:underline transition-colors")}>
            {author.displayName}
          </span>
          {isAiResponse && (
            <Badge variant="default" className="rounded-full px-1.5 py-0 text-[10px] bg-primary">
              {isImageAiResponse ? "Image AI" : "AI"}
            </Badge>
          )}
          {!isAiResponse && isAdmin && (
            <Badge variant="default" className="rounded-full px-1.5 py-0 text-[10px]">
              Admin
            </Badge>
          )}
          {!isAiResponse && isMod && (
            <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px]">
              Mod
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {!isAiResponse && <span className="hover:text-primary transition-colors">@{author.username}</span>}
          {!isAiResponse && <span>·</span>}
          <span>{formatDate(post.createdAt)}</span>
          {post.updatedAt && post.updatedAt !== post.createdAt && (
            <>
              <span>·</span>
              <span className="italic">edited</span>
            </>
          )}
        </div>
      </div>
    )

    if (isAiResponse) {
      return (
        <div className="flex items-center gap-3">
          {avatarElement}
          {nameElement}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-3">
        <Link href={`/user/${author.username}`} className="hover:opacity-80 transition-opacity">
          {avatarElement}
        </Link>
        <Link href={`/user/${author.username}`}>{nameElement}</Link>
      </div>
    )
  }

  return (
    <>
      <article
        className={cn(
          "rounded-xl border border-border bg-card p-5",
          isReply && "ml-8 border-l-2 border-l-primary/30",
          isAiResponse && "border-primary/30 bg-primary/5",
        )}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          {renderAuthorInfo()}

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
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

        {/* Content */}
        <div className="prose prose-invert prose-sm max-w-none mb-4">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px] resize-none"
                placeholder="Edit your reply..."
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEdit} disabled={isSaving || !editContent.trim()}>
                  {isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                  Save
                </Button>
              </div>
            </div>
          ) : richContent ? (
            <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: richContent }} />
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {content.split("```").map((part, index) => {
                if (index % 2 === 1) {
                  const [lang, ...code] = part.split("\n")
                  return (
                    <pre key={index} className="rounded-lg bg-muted p-4 overflow-x-auto my-2">
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

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn("gap-1.5 rounded-full", liked && "text-red-500 hover:text-red-500")}
          >
            <Heart className={cn("h-4 w-4", liked && "fill-current")} />
            {formatNumber(likeCount)}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 rounded-full" onClick={() => onReply?.(post.id)}>
            <Reply className="h-4 w-4" />
            Reply
          </Button>
        </div>
      </article>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reply</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reply? This action cannot be undone.
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
