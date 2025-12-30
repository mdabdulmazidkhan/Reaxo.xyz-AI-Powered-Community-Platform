"use client"

import { useState, useEffect } from "react"
import { Loader2, Bookmark, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThreadCard } from "@/components/thread-card"
import { useAuth } from "@/lib/auth-context"
import { AuthModal } from "@/components/auth-modal"
import type { Thread } from "@/lib/types"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function SavedThreadList() {
  const { user } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [savedIds, setSavedIds] = useState<string[]>([])

  // Load saved post IDs from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`saved-posts-${user.id}`)
      if (saved) {
        setSavedIds(JSON.parse(saved))
      }
    }
  }, [user])

  const { data, error, isLoading, mutate } = useSWR<{ threads: Thread[] }>(
    user ? `/api/threads?limit=50` : null,
    fetcher,
  )

  const allThreads = data?.threads || data?.data || []

  const savedThreads = allThreads.filter((thread: Thread) => savedIds.includes(thread.id))

  if (!user) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <LogIn className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Sign in to view saved posts</h3>
        <p className="text-muted-foreground mb-4">Create an account to save and access your favorite posts.</p>
        <Button onClick={() => setAuthModalOpen(true)}>Sign In</Button>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Failed to load saved posts. Please try again.</p>
        <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={() => mutate()}>
          Retry
        </Button>
      </div>
    )
  }

  if (savedThreads.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Bookmark className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No saved posts yet</h3>
        <p className="text-muted-foreground">Click the bookmark icon on any post to save it here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{savedThreads.length} saved posts</span>
        <Button variant="ghost" size="sm" onClick={() => mutate()} className="ml-auto">
          Refresh
        </Button>
      </div>
      <div className="space-y-3">
        {savedThreads.map((thread: Thread) => (
          <ThreadCard key={thread.id} thread={thread} showForum={true} />
        ))}
      </div>
    </div>
  )
}
