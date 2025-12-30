"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Search, Globe, FileText, Loader2, MessageSquare, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Forum {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  themeColor?: string
  memberCount: number
}

interface Thread {
  id: string
  title: string
  body: string
  createdAt: string
  likesCount: number
  postsCount: number
  user?: {
    username: string
    displayName?: string
    avatar?: string
  }
  extendedData?: {
    forumSlug?: string
    forumName?: string
    authorUsername?: string
    authorDisplayName?: string
    authorAvatar?: string
  }
}

export function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""
  const type = searchParams.get("type") || "posts"

  const [activeTab, setActiveTab] = useState(type === "forums" ? "forums" : "posts")
  const [forums, setForums] = useState<Forum[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // Fetch both in parallel
        const [forumsRes, threadsRes] = await Promise.all([fetch("/api/forums"), fetch("/api/threads")])

        if (forumsRes.ok) {
          const forumsData = await forumsRes.json()
          const allForums = forumsData.data || []
          setForums(
            allForums.filter(
              (forum: Forum) =>
                forum.name.toLowerCase().includes(query.toLowerCase()) ||
                forum.slug.toLowerCase().includes(query.toLowerCase()) ||
                forum.description?.toLowerCase().includes(query.toLowerCase()),
            ),
          )
        }

        if (threadsRes.ok) {
          const threadsData = await threadsRes.json()
          const allThreads = threadsData.data || []
          setThreads(
            allThreads.filter(
              (thread: Thread) =>
                thread.title?.toLowerCase().includes(query.toLowerCase()) ||
                thread.body?.toLowerCase().includes(query.toLowerCase()),
            ),
          )
        }
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [query])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const handlePostClick = (thread: Thread) => {
    const forumSlug = thread.extendedData?.forumSlug
    if (forumSlug) {
      router.push(`/f/${forumSlug}/thread/${thread.id}`)
    } else {
      router.push(`/thread/${thread.id}`)
    }
  }

  const handleForumClick = (slug: string) => {
    router.push(`/f/${slug}`)
  }

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Search className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Search Reaxo</h2>
        <p className="text-muted-foreground max-w-md">
          Search for posts, threads, and forums. Use the search bar above to get started.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Search results for "{query}"</h1>
        <p className="text-muted-foreground">
          Found {threads.length} posts and {forums.length} forums
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Posts ({threads.length})
          </TabsTrigger>
          <TabsTrigger value="forums" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Forums ({forums.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No posts found matching "{query}"</p>
              <p className="text-sm mt-2">Try different keywords</p>
            </div>
          ) : (
            <div className="space-y-3">
              {threads.map((thread) => {
                const authorName =
                  thread.extendedData?.authorDisplayName ||
                  thread.extendedData?.authorUsername ||
                  thread.user?.displayName ||
                  thread.user?.username ||
                  "Anonymous"
                const authorUsername = thread.extendedData?.authorUsername || thread.user?.username

                return (
                  <div
                    key={thread.id}
                    onClick={() => handlePostClick(thread)}
                    className="p-4 rounded-lg border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {thread.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                          {thread.body?.replace(/<[^>]*>/g, "").slice(0, 200)}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {thread.extendedData?.forumName && (
                            <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                              <Globe className="h-3 w-3" />
                              f/{thread.extendedData.forumSlug}
                            </span>
                          )}
                          <Link
                            href={`/user/${authorUsername}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-primary hover:underline transition-colors"
                          >
                            by {authorName}
                          </Link>
                          {authorUsername && (
                            <Link
                              href={`/user/${authorUsername}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-primary transition-colors"
                            >
                              @{authorUsername}
                            </Link>
                          )}
                          <span>{formatTimeAgo(thread.createdAt)}</span>
                          <span>{thread.likesCount || 0} likes</span>
                          <span>{thread.postsCount || 0} comments</span>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="forums">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : forums.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No forums found matching "{query}"</p>
              <p className="text-sm mt-2">Try a different search term</p>
              <Button asChild variant="outline" className="mt-4 bg-transparent">
                <Link href="/discover">Browse all forums</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {forums.map((forum) => (
                <div
                  key={forum.id}
                  onClick={() => handleForumClick(forum.slug)}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer group"
                >
                  {forum.icon ? (
                    <img
                      src={forum.icon || "/placeholder.svg"}
                      alt={forum.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                      style={{ backgroundColor: forum.themeColor || "#00bf62" }}
                    >
                      {forum.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">f/{forum.slug}</h3>
                    <p className="text-sm text-muted-foreground truncate">{forum.description || forum.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{forum.memberCount} members</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
