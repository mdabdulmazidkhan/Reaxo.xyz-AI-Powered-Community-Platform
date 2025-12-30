"use client"

import { Loader2, Plus, TrendingUp, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThreadCard } from "@/components/thread-card"
import type { Thread, PaginatedResponse } from "@/lib/types"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ThreadsResponse extends PaginatedResponse<Thread> {
  threads?: Thread[]
}

interface FilteredThreadListProps {
  filter: "trending" | "newest" | "oldest"
}

export function FilteredThreadList({ filter }: FilteredThreadListProps) {
  const { data, error, isLoading, mutate } = useSWR<ThreadsResponse>(`/api/threads?filter=${filter}&limit=20`, fetcher)

  const threads = data?.data || data?.threads || []

  const sortedThreads =
    filter === "trending" ? [...threads].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0)) : threads

  const icon = filter === "trending" ? TrendingUp : Clock
  const Icon = icon

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" className="gap-2 rounded-full bg-primary text-primary-foreground">
          <Icon className="h-4 w-4" />
          {filter === "trending" ? "Trending" : filter === "newest" ? "Recent" : "Oldest"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => mutate()} className="ml-auto">
          Refresh
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">Failed to load threads. Please try again.</p>
          <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={() => mutate()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && sortedThreads.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No threads yet</h3>
          <p className="text-muted-foreground">Check back later for new content!</p>
        </div>
      )}

      {!isLoading && sortedThreads.length > 0 && (
        <div className="space-y-3">
          {sortedThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} showForum={true} />
          ))}
        </div>
      )}
    </div>
  )
}
