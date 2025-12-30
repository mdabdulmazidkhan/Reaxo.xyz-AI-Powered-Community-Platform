"use client"

import { useEffect, useState } from "react"
import { MessageSquare, Eye, Heart, Clock, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { Forum } from "@/lib/types"
import Link from "next/link"
import { formatDate } from "@/lib/forum-client"

interface ForumThreadListProps {
  forum: Forum
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
    displayName?: string
    avatarUrl?: string
  }
  postsCount?: number
  likesCount?: number
  _count?: {
    replies: number
    reactions: number
  }
  extendedData?: {
    richContent?: string
    forumId?: string
  }
}

export function ForumThreadList({ forum }: ForumThreadListProps) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchThreads() {
      try {
        setLoading(true)
        const response = await fetch(`/api/threads?forumId=${forum.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch threads")
        }
        const data = await response.json()
        setThreads(data.threads || data.data || [])
      } catch (err) {
        console.error("Error fetching threads:", err)
        setError(err instanceof Error ? err.message : "Failed to load threads")
      } finally {
        setLoading(false)
      }
    }

    fetchThreads()
  }, [forum.id]) // Use forum.id instead of forum.subdomain

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">{error}</p>
      </Card>
    )
  }

  if (threads.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No threads yet. Be the first to start a discussion!</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recent Threads</h2>
      </div>

      <div className="space-y-2">
        {threads.map((thread) => (
          <Link key={thread.id} href={`/f/${forum.slug}/thread/${thread.id}`}>
            <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={thread.user?.avatarUrl || "/placeholder.svg?height=40&width=40&query=user avatar"}
                    alt={thread.user?.username || "User"}
                  />
                  <AvatarFallback>{(thread.user?.username || "U")[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {thread.pinned && (
                      <Badge variant="secondary" className="text-xs">
                        Pinned
                      </Badge>
                    )}
                    {thread.locked && (
                      <Badge variant="outline" className="text-xs">
                        Locked
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium line-clamp-1">{thread.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{thread.body?.substring(0, 100)}...</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {thread.postsCount || thread._count?.replies || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {thread.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      {thread.likesCount || thread._count?.reactions || 0}
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(thread.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
