"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, TrendingUp, Clock, Bookmark, Users, Tag, ChevronDown, Loader2, Compass, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/forum-client"
import type { Tag as TagType, PaginatedResponse, Forum } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const navigation = [
  { name: "Home", icon: Home, href: "/" },
  { name: "Discover", icon: Compass, href: "/forums" },
  { name: "Trending", icon: TrendingUp, href: "/trending" },
  { name: "Recent", icon: Clock, href: "/recent" },
  { name: "Saved", icon: Bookmark, href: "/saved" },
]

export function Sidebar() {
  const [tagsExpanded, setTagsExpanded] = useState(true)
  const [forumsExpanded, setForumsExpanded] = useState(true)
  const { user } = useAuth()
  const pathname = usePathname()

  const { data: tagsData, isLoading: tagsLoading } = useSWR<PaginatedResponse<TagType>>("/api/tags", fetcher)
  const { data: membershipsData, isLoading: forumsLoading } = useSWR<{ forums: Forum[] }>(
    user ? `/api/forums/memberships?userId=${user.id}` : null,
    fetcher,
  )

  const tags = tagsData?.data || []
  const joinedForums = membershipsData?.forums || []

  const tagColors = [
    "bg-blue-500",
    "bg-primary",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-yellow-500",
    "bg-red-500",
  ]

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-20 space-y-6">
        {/* Navigation */}
        <nav className="space-y-1">
          {navigation.map((item) => (
            <Button
              key={item.name}
              variant={pathname === item.href ? "secondary" : "ghost"}
              className={cn("w-full justify-start gap-3", pathname === item.href && "bg-primary/10 text-primary")}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Joined Forums */}
        {user && (
          <div>
            <button
              onClick={() => setForumsExpanded(!forumsExpanded)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Your Forums
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", forumsExpanded && "rotate-180")} />
            </button>

            {forumsExpanded && (
              <div className="mt-2 space-y-1">
                {forumsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : joinedForums.length === 0 ? (
                  <div className="px-3 py-2">
                    <p className="text-sm text-muted-foreground mb-2">No forums joined yet</p>
                    <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                      <Link href="/forums">
                        <Compass className="h-4 w-4 mr-2" />
                        Discover Forums
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {joinedForums.slice(0, 5).map((forum) => (
                      <Button
                        key={forum.id}
                        variant="ghost"
                        className="w-full justify-start px-3 text-sm font-normal"
                        asChild
                      >
                        <Link href={`/f/${forum.slug}`}>
                          {forum.icon ? (
                            <img
                              src={forum.icon || "/placeholder.svg"}
                              alt={forum.name}
                              className="h-5 w-5 rounded object-cover mr-2"
                            />
                          ) : (
                            <span
                              className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold mr-2 text-white"
                              style={{ backgroundColor: forum.themeColor || "#00bf62" }}
                            >
                              {forum.name[0].toUpperCase()}
                            </span>
                          )}
                          <span className="truncate">f/{forum.slug}</span>
                        </Link>
                      </Button>
                    ))}
                    {joinedForums.length > 5 && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-3 text-sm font-normal text-muted-foreground"
                        asChild
                      >
                        <Link href="/forums">View all ({joinedForums.length})...</Link>
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create Forum CTA */}
        {user && (
          <Button className="w-full" asChild>
            <Link href="/dashboard">
              <Plus className="h-4 w-4 mr-2" />
              Create Forum
            </Link>
          </Button>
        )}

        {/* Tags */}
        <div>
          <button
            onClick={() => setTagsExpanded(!tagsExpanded)}
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Popular Tags
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", tagsExpanded && "rotate-180")} />
          </button>

          {tagsExpanded && (
            <div className="mt-2 space-y-1">
              {tagsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : tags.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">No tags yet</p>
              ) : (
                tags.slice(0, 6).map((tag, index) => (
                  <Button key={tag.id} variant="ghost" className="w-full justify-between px-3 text-sm font-normal">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn("h-2 w-2 rounded-full", !tag.color && tagColors[index % tagColors.length])}
                        style={tag.color ? { backgroundColor: tag.color } : undefined}
                      />
                      {tag.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatNumber(tag.threadCount || 0)}</span>
                  </Button>
                ))
              )}
              {tags.length > 6 && (
                <Button variant="ghost" className="w-full justify-start px-3 text-sm font-normal text-muted-foreground">
                  View all tags...
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
