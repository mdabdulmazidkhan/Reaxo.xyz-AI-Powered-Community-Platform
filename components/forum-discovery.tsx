"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Users, MessageSquare, Lock, Globe, Loader2, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { AuthModal } from "@/components/auth-modal"
import type { Forum } from "@/lib/types"
import useSWR from "swr"
import { formatNumber } from "@/lib/forum-client"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ForumDiscovery() {
  const [search, setSearch] = useState("")
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [joiningForumId, setJoiningForumId] = useState<string | null>(null)
  const { user } = useAuth()

  const {
    data: forumsData,
    isLoading,
    mutate: mutateForums,
  } = useSWR<{ data: Forum[] }>("/api/forums?public=true", fetcher)
  const { data: membershipsData, mutate: mutateMemberships } = useSWR<{ forums: Forum[] }>(
    user ? `/api/forums/memberships?userId=${user.id}` : null,
    fetcher,
  )

  const forums = forumsData?.data || []
  const joinedForums = membershipsData?.forums || []
  const joinedIds = new Set(joinedForums.map((f) => f.id))

  const filteredForums = forums.filter(
    (forum) =>
      forum.name.toLowerCase().includes(search.toLowerCase()) ||
      forum.description?.toLowerCase().includes(search.toLowerCase()) ||
      forum.slug.toLowerCase().includes(search.toLowerCase()),
  )

  const popularForums = [...filteredForums].sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
  const newForums = [...filteredForums].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const handleJoin = async (forumId: string) => {
    if (!user) {
      setAuthModalOpen(true)
      return
    }

    setJoiningForumId(forumId)
    try {
      const res = await fetch(`/api/forums/${forumId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })

      if (res.ok) {
        // Refresh both lists
        await Promise.all([mutateMemberships(), mutateForums()])
      }
    } catch (error) {
      console.error("Failed to join forum:", error)
    } finally {
      setJoiningForumId(null)
    }
  }

  const handleLeave = async (forumId: string) => {
    if (!user) return

    setJoiningForumId(forumId)
    try {
      const res = await fetch(`/api/forums/${forumId}/join?userId=${user.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        await Promise.all([mutateMemberships(), mutateForums()])
      }
    } catch (error) {
      console.error("Failed to leave forum:", error)
    } finally {
      setJoiningForumId(null)
    }
  }

  const ForumCard = ({ forum }: { forum: Forum }) => {
    const isJoined = joinedIds.has(forum.id)
    const isOwner = forum.ownerId === user?.id
    const isLoading = joiningForumId === forum.id

    return (
      <Card className="group hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {forum.icon ? (
                <Image
                  src={forum.icon || "/placeholder.svg"}
                  alt={forum.name}
                  width={40}
                  height={40}
                  className="rounded-lg shrink-0"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                  style={{ backgroundColor: forum.settings?.primaryColor || "#00bf62" }}
                >
                  {forum.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <Link href={`/f/${forum.slug}`} className="hover:underline">
                  <CardTitle className="text-lg truncate">{forum.name}</CardTitle>
                </Link>
                <CardDescription className="flex items-center gap-1 mt-0.5">
                  <span className="text-primary font-medium">f/{forum.slug}</span>
                  {forum.isPublic ? <Globe className="h-3 w-3 ml-1" /> : <Lock className="h-3 w-3 ml-1" />}
                </CardDescription>
              </div>
            </div>
            <Badge variant={forum.isPublic ? "secondary" : "outline"} className="shrink-0">
              {forum.isPublic ? "Public" : "Private"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
            {forum.description || "No description"}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {formatNumber(forum.memberCount || 0)}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {formatNumber(forum.threadCount || 0)}
              </span>
            </div>
            {isOwner ? (
              <Badge variant="default" className="gap-1">
                <Check className="h-3 w-3" />
                Owner
              </Badge>
            ) : isJoined ? (
              <Button variant="outline" size="sm" onClick={() => handleLeave(forum.id)} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Joined"}
              </Button>
            ) : (
              <Button size="sm" onClick={() => handleJoin(forum.id)} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search forums..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="popular" className="w-full">
          <TabsList>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            {user && <TabsTrigger value="joined">Joined ({joinedForums.length})</TabsTrigger>}
          </TabsList>

          <TabsContent value="popular" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popularForums.map((forum) => (
                <ForumCard key={forum.id} forum={forum} />
              ))}
            </div>
            {popularForums.length === 0 && <p className="text-center text-muted-foreground py-8">No forums found</p>}
          </TabsContent>

          <TabsContent value="new" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {newForums.map((forum) => (
                <ForumCard key={forum.id} forum={forum} />
              ))}
            </div>
            {newForums.length === 0 && <p className="text-center text-muted-foreground py-8">No forums found</p>}
          </TabsContent>

          {user && (
            <TabsContent value="joined" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {joinedForums.map((forum) => (
                  <ForumCard key={forum.id} forum={forum} />
                ))}
              </div>
              {joinedForums.length === 0 && (
                <p className="text-center text-muted-foreground py-8">You haven't joined any forums yet</p>
              )}
            </TabsContent>
          )}
        </Tabs>
      )}

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  )
}
