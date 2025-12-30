"use client"

import { useState } from "react"
import { Clock, TrendingUp, Loader2, Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThreadCard } from "@/components/thread-card"
import { cn } from "@/lib/utils"
import type { Thread, PaginatedResponse } from "@/lib/types"
import useSWR from "swr"
import { useAuth } from "@/lib/auth-context"
import { AuthModal } from "@/components/auth-modal"
import { NewThreadModal } from "@/components/new-thread-modal"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const filters = [
  { id: "newest", label: "New", icon: Clock },
  { id: "oldest", label: "Top", icon: TrendingUp },
]

interface ThreadsResponse extends PaginatedResponse<Thread> {
  threads?: Thread[]
}

export function ThreadList() {
  const [activeFilter, setActiveFilter] = useState("newest")
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [newThreadModalOpen, setNewThreadModalOpen] = useState(false)
  const { user } = useAuth()

  const { data, error, isLoading, mutate, isValidating } = useSWR<ThreadsResponse>(
    `/api/threads?filter=${activeFilter}&limit=10`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    },
  )

  const threads = data?.data || data?.threads || []

  const handleNewThread = () => {
    if (!user) {
      setAuthModalOpen(true)
    } else {
      setNewThreadModalOpen(true)
    }
  }

  const handleThreadCreated = async () => {
    await mutate()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              "gap-2 rounded-full",
              activeFilter === filter.id && "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            <filter.icon className="h-4 w-4" />
            {filter.label}
          </Button>
        ))}

        <Button variant="ghost" size="sm" onClick={() => mutate()} disabled={isValidating} className="ml-auto gap-2">
          <RefreshCw className={cn("h-4 w-4", isValidating && "animate-spin")} />
          {isValidating ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">Failed to load threads. Please try again.</p>
          <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={() => mutate()}>
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && threads.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No threads yet</h3>
          <p className="text-muted-foreground mb-4">Be the first to start a discussion!</p>
          <Button onClick={handleNewThread}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Thread
          </Button>
        </div>
      )}

      {/* Thread List - Now uses threads directly without overriding forum data */}
      {!isLoading && threads.length > 0 && (
        <div className="space-y-3">
          {threads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} showForum={true} />
          ))}
        </div>
      )}

      {/* Modals */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <NewThreadModal open={newThreadModalOpen} onOpenChange={setNewThreadModalOpen} onCreated={handleThreadCreated} />
    </div>
  )
}
