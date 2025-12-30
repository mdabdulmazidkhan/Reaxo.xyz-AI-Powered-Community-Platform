"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, MessageSquare, Loader2, Globe, ArrowRight, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

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
  user?: {
    username: string
    displayName?: string
    avatar?: string
  }
  extendedData?: {
    forumSlug?: string
    forumName?: string
  }
}

interface SearchResults {
  forums: Forum[]
  threads: Thread[]
}

export function SearchCommand() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults>({ forums: [], threads: [] })
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const getSearchQuery = useCallback(() => {
    // Remove f/ prefix if present
    if (query.startsWith("f/")) return query.slice(2)
    return query
  }, [query])

  useEffect(() => {
    const searchQuery = getSearchQuery()

    if (!searchQuery || searchQuery.length < 1) {
      setResults({ forums: [], threads: [] })
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      try {
        const newResults: SearchResults = { forums: [], threads: [] }

        const [forumsRes, threadsRes] = await Promise.all([
          fetch("/api/forums"),
          searchQuery.length >= 2 ? fetch("/api/threads") : Promise.resolve(null),
        ])

        // Filter forums - instant matching even with 1 character
        if (forumsRes.ok) {
          const forumsData = await forumsRes.json()
          const allForums = forumsData.data || []
          newResults.forums = allForums
            .filter(
              (forum: Forum) =>
                forum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                forum.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                forum.description?.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .slice(0, 5)
        }

        // Filter threads - requires at least 2 characters
        if (threadsRes && threadsRes.ok) {
          const threadsData = await threadsRes.json()
          const allThreads = threadsData.data || []
          newResults.threads = allThreads
            .filter(
              (thread: Thread) =>
                thread.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                thread.body?.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .slice(0, 5)
        }

        setResults(newResults)
        setActiveIndex(0)
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchResults, 150)
    return () => clearTimeout(debounce)
  }, [query, getSearchQuery])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !open && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault()
        setOpen(true)
        inputRef.current?.focus()
      }

      if (e.key === "Escape") {
        setOpen(false)
        setQuery("")
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Calculate total items for keyboard navigation
  const totalItems = results.forums.length + results.threads.length

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % Math.max(totalItems, 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const searchQuery = getSearchQuery()

      // If no results selected, go to search page
      if (totalItems === 0 && searchQuery.length >= 2) {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
        setOpen(false)
        setQuery("")
        return
      }

      // Navigate to selected item
      let currentIndex = 0

      for (const forum of results.forums) {
        if (currentIndex === activeIndex) {
          router.push(`/f/${forum.slug}`)
          setOpen(false)
          setQuery("")
          return
        }
        currentIndex++
      }

      for (const thread of results.threads) {
        if (currentIndex === activeIndex) {
          const forumSlug = thread.extendedData?.forumSlug
          if (forumSlug) {
            router.push(`/f/${forumSlug}/thread/${thread.id}`)
          } else {
            router.push(`/thread/${thread.id}`)
          }
          setOpen(false)
          setQuery("")
          return
        }
        currentIndex++
      }
    }
  }

  const handleViewAllResults = () => {
    const searchQuery = getSearchQuery()
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    setOpen(false)
    setQuery("")
  }

  const handleForumClick = (slug: string) => {
    router.push(`/f/${slug}`)
    setOpen(false)
    setQuery("")
  }

  const handleThreadClick = (thread: Thread) => {
    const forumSlug = thread.extendedData?.forumSlug
    if (forumSlug) {
      router.push(`/f/${forumSlug}/thread/${thread.id}`)
    } else {
      router.push(`/thread/${thread.id}`)
    }
    setOpen(false)
    setQuery("")
  }

  const searchQuery = getSearchQuery()
  const hasResults = results.forums.length > 0 || results.threads.length > 0
  const showDropdown = open && query.length > 0

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search posts, forums..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyNavigation}
          className={cn("w-full pl-10 pr-12 transition-all", open && "ring-2 ring-primary")}
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          /
        </kbd>
      </div>

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-border bg-background shadow-lg overflow-hidden z-50">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && !hasResults && searchQuery.length > 0 && (
            <div className="py-6 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No results found for "{searchQuery}"</p>
              <p className="text-sm mt-1">Try different keywords</p>
              {searchQuery.length >= 2 && (
                <button onClick={handleViewAllResults} className="mt-3 text-sm text-primary hover:underline">
                  View all search results
                </button>
              )}
            </div>
          )}

          {!loading && hasResults && (
            <div className="max-h-[400px] overflow-y-auto">
              {/* Forums Section - Always shows when forums match */}
              {results.forums.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    Forums
                  </div>
                  {results.forums.map((forum, index) => (
                    <div
                      key={forum.id}
                      onClick={() => handleForumClick(forum.slug)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 hover:bg-primary/10 transition-colors cursor-pointer",
                        activeIndex === index && "bg-primary/10",
                      )}
                    >
                      {forum.icon ? (
                        <img
                          src={forum.icon || "/placeholder.svg"}
                          alt={forum.name}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: forum.themeColor || "#00bf62" }}
                        >
                          {forum.name[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">f/{forum.slug}</span>
                          <span className="text-xs text-muted-foreground">{forum.memberCount} members</span>
                        </div>
                        {forum.description && (
                          <p className="text-sm text-muted-foreground truncate">{forum.description}</p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  ))}
                </div>
              )}

              {/* Threads/Posts Section */}
              {results.threads.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    Posts
                  </div>
                  {results.threads.map((thread, index) => {
                    const itemIndex = results.forums.length + index

                    return (
                      <div
                        key={thread.id}
                        onClick={() => handleThreadClick(thread)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 hover:bg-primary/10 transition-colors cursor-pointer",
                          activeIndex === itemIndex && "bg-primary/10",
                        )}
                      >
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{thread.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {thread.extendedData?.forumName && <span>in f/{thread.extendedData.forumSlug}</span>}
                            {thread.user && <span>by {thread.user.displayName || thread.user.username}</span>}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* View All Results */}
              {searchQuery.length >= 2 && (
                <button
                  onClick={handleViewAllResults}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 text-sm text-primary hover:bg-primary/10 transition-colors border-t border-border font-medium"
                >
                  <Search className="h-4 w-4" />
                  View all results for "{searchQuery}"
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Quick hint when typing */}
          {!loading && query.length > 0 && searchQuery.length < 2 && results.forums.length === 0 && (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search posts
            </div>
          )}
        </div>
      )}
    </div>
  )
}
