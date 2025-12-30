"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowLeft, Heart, MessageSquare, Calendar, FileText } from "lucide-react"
import { ThreadCard } from "@/components/thread-card"
import { formatDate } from "@/lib/forum-client"

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => {
      console.log("[v0] Fetching user profile from:", url)
      return res.json()
    })
    .then((data) => {
      console.log("[v0] User profile data received:", data)
      return data
    })

interface UserProfileContentProps {
  username: string
}

export function UserProfileContent({ username }: UserProfileContentProps) {
  const [activeTab, setActiveTab] = useState("threads")

  const { data, isLoading, error } = useSWR(`/api/users/${encodeURIComponent(username)}`, fetcher)

  console.log(
    "[v0] UserProfileContent render - username:",
    username,
    "data:",
    data,
    "isLoading:",
    isLoading,
    "error:",
    error,
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data || data.error) {
    console.log("[v0] Error state - error:", error, "data:", data)
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">User not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { user, threads = [], replies = [], stats = {} } = data

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Link href="/">
        <Button variant="ghost" size="sm" className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Button>
      </Link>

      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.avatar || undefined} alt={user?.displayName || username} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {(user?.displayName || username)?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{user?.displayName || username}</h1>
              <p className="text-muted-foreground">@{user?.username || username}</p>

              {user?.bio && <p className="mt-3 text-sm text-muted-foreground">{user.bio}</p>}

              {/* Stats */}
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium text-foreground">{stats.totalPosts || 0}</span> posts
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-foreground">{stats.totalLikes || 0}</span> likes
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium text-foreground">{stats.totalReplies || 0}</span> replies
                </div>
                {user?.joinedAt && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDate(user.joinedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="threads">Threads ({threads.length})</TabsTrigger>
          <TabsTrigger value="replies">Replies ({replies.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="threads">
          {threads.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No threads yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {threads.map((thread: any) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="replies">
          {replies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No replies yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {replies.map((reply: any) => (
                <Card key={reply.id}>
                  <CardContent className="py-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Replied to{" "}
                      <Link href={`/thread/${reply.threadId}`} className="text-primary hover:underline">
                        {reply.threadTitle || "a thread"}
                      </Link>
                    </p>
                    <p className="text-sm">{reply.body?.replace(/<[^>]*>/g, "").slice(0, 200)}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(reply.createdAt)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
