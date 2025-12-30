"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2 } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ForumCard } from "@/components/dashboard/forum-card"
import { CreateForumModal } from "@/components/dashboard/create-forum-modal"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { AuthModal } from "@/components/auth-modal"
import type { Forum, ForumSettings } from "@/lib/types"

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [forums, setForums] = useState<Forum[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchForums()
    } else if (!authLoading) {
      setIsLoading(false)
    }
  }, [user, authLoading])

  const fetchForums = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/forums?ownerId=${user.id}`)
      const data = await res.json()
      setForums(data.data || [])
    } catch (error) {
      console.error("Failed to fetch forums:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateForum = async (data: {
    name: string
    slug: string
    description: string
    isPublic: boolean
    icon?: string
    settings?: ForumSettings
  }) => {
    if (!user) return

    const res = await fetch("/api/forums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, ownerId: user.id }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error)
    }

    await fetchForums()
  }

  const handleDeleteForum = async (id: string) => {
    if (!confirm("Are you sure you want to delete this forum? This action cannot be undone.")) return

    await fetch(`/api/forums/${id}`, { method: "DELETE" })
    await fetchForums()
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
          <h1 className="text-2xl font-bold">Sign in to access your dashboard</h1>
          <p className="text-muted-foreground">Create and manage your own forums</p>
          <Button onClick={() => setAuthModalOpen(true)}>Sign In</Button>
        </div>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your forums and communities</p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Forum
          </Button>
        </div>

        <StatsCards forums={forums} />

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Your Forums</h2>
          {forums.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <h3 className="text-lg font-medium">No forums yet</h3>
              <p className="text-muted-foreground mt-1">Create your first forum to get started</p>
              <Button onClick={() => setCreateModalOpen(true)} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create Forum
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {forums.map((forum) => (
                <ForumCard key={forum.id} forum={forum} onDelete={handleDeleteForum} />
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateForumModal open={createModalOpen} onOpenChange={setCreateModalOpen} onSubmit={handleCreateForum} />
    </div>
  )
}
