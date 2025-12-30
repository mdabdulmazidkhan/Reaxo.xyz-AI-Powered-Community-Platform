"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Loader2, Globe, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { RichTextEditor } from "@/components/editor/rich-text-editor"
import type { Forum } from "@/lib/types"
import { mutate } from "swr"

interface NewThreadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
  defaultForumId?: string
}

export function NewThreadModal({ open, onOpenChange, onCreated, defaultForumId }: NewThreadModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [forums, setForums] = useState<Forum[]>([])
  const [loadingForums, setLoadingForums] = useState(false)
  const { token, user } = useAuth()

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    forumId: defaultForumId || "homeFeed",
  })

  useEffect(() => {
    if (open && user) {
      setLoadingForums(true)
      fetch(`/api/forums/memberships?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          setForums(data.forums || [])
        })
        .catch((err) => {
          console.error("Failed to load forums:", err)
        })
        .finally(() => setLoadingForums(false))
    }
  }, [open, user])

  useEffect(() => {
    if (defaultForumId) {
      setFormData((prev) => ({ ...prev, forumId: defaultForumId }))
    }
  }, [defaultForumId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const strippedContent = formData.content.replace(/<[^>]*>/g, "").trim()
    if (!strippedContent) {
      setError("Please add some content to your post")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          forumId: formData.forumId === "homeFeed" ? undefined : formData.forumId,
          userId: user?.id,
          username: user?.username,
          displayName: user?.displayName,
          avatar: user?.avatar,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create thread")
      }

      onOpenChange(false)
      setFormData({ title: "", content: "", forumId: defaultForumId || "homeFeed" })

      await mutate((key) => typeof key === "string" && key.startsWith("/api/threads"))

      onCreated?.()
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const selectedForum = forums.find((f) => f.id === formData.forumId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Start a new thread</DialogTitle>
          <DialogDescription>
            Share your thoughts with rich media - add images, videos, code, and more
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forum">Post to</Label>
            <Select value={formData.forumId} onValueChange={(value) => setFormData({ ...formData, forumId: value })}>
              <SelectTrigger id="forum" className="w-full">
                <SelectValue placeholder="Select where to post...">
                  {formData.forumId === "homeFeed" ? (
                    <span className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Home Feed
                    </span>
                  ) : selectedForum ? (
                    <span className="flex items-center gap-2">
                      {selectedForum.icon ? (
                        <img
                          src={selectedForum.icon || "/placeholder.svg"}
                          alt=""
                          className="h-4 w-4 rounded object-cover"
                        />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                      f/{selectedForum.slug}
                    </span>
                  ) : (
                    "Select where to post..."
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="homeFeed">
                  <span className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>
                      <span className="font-medium">Home Feed</span>
                      <span className="text-muted-foreground text-xs ml-2">Visible to everyone</span>
                    </span>
                  </span>
                </SelectItem>

                {loadingForums ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : forums.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No forums joined yet. Create or join a forum first!
                  </div>
                ) : (
                  forums.map((forum) => (
                    <SelectItem key={forum.id} value={forum.id}>
                      <span className="flex items-center gap-2">
                        {forum.icon ? (
                          <img src={forum.icon || "/placeholder.svg"} alt="" className="h-4 w-4 rounded object-cover" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                        <span>
                          <span className="font-medium">f/{forum.slug}</span>
                          <span className="text-muted-foreground text-xs ml-2">{forum.name}</span>
                        </span>
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.forumId === "homeFeed"
                ? "This post will appear on the main home feed"
                : `This post will appear in f/${selectedForum?.slug || "..."}`}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What's on your mind?"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Write your post... Add images, videos, code blocks, and more!"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Thread"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
