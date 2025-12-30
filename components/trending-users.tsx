"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Heart } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface TopContributor {
  userId: string
  username: string
  displayName: string
  avatar: string | null
  totalLikes: number
  postCount: number
}

function formatNumber(num: unknown): string {
  const n = typeof num === "number" ? num : typeof num === "string" ? Number.parseInt(num, 10) : 0
  if (isNaN(n)) return "0"
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M"
  if (n >= 1000) return (n / 1000).toFixed(1) + "K"
  return n.toString()
}

export function TrendingUsers() {
  const { data, isLoading } = useSWR<{ data: TopContributor[] }>("/api/top-contributors?limit=5", fetcher)

  const contributors = data?.data || []

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium">Top Contributors</h3>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : contributors.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No contributors yet</p>
      ) : (
        <div className="space-y-3">
          {contributors.map((contributor, index) => (
            <Link
              key={contributor.userId}
              href={`/user/${contributor.username}`}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contributor.avatar || undefined} alt={contributor.displayName} />
                  <AvatarFallback>{contributor.displayName?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="block truncate text-sm font-medium">{contributor.displayName}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3 fill-current text-red-500" />
                    {formatNumber(contributor.totalLikes)}
                  </span>
                  <span>·</span>
                  <span>{formatNumber(contributor.postCount)} posts</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
