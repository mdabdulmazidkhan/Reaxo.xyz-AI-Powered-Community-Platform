"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Check, X, Loader2, Upload, ImageIcon, Users, Shield } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ForumSettings } from "@/lib/types"

interface CreateForumModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    name: string
    slug: string
    description: string
    isPublic: boolean
    icon?: string
    settings?: ForumSettings
  }) => Promise<void>
}

export function CreateForumModal({ open, onOpenChange, onSubmit }: CreateForumModalProps) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [icon, setIcon] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Settings state
  const [settings, setSettings] = useState<ForumSettings>({
    requirePostApproval: false,
    requireMemberApproval: false,
    allowGuests: true,
    allowImages: true,
    allowVideos: true,
    allowLinks: true,
    minPostLength: 10,
    maxPostLength: 50000,
    primaryColor: "#00bf62",
  })

  // Auto-generate slug from name
  useEffect(() => {
    if (name && !slug) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 20)
      setSlug(generated)
    }
  }, [name, slug])

  // Check slug availability
  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugStatus("idle")
      return
    }

    const timer = setTimeout(async () => {
      setSlugStatus("checking")
      try {
        const res = await fetch(`/api/forums/check-slug?slug=${slug}`)
        const data = await res.json()
        setSlugStatus(data.available ? "available" : "taken")
      } catch {
        setSlugStatus("idle")
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [slug])

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setIcon(data.url)
      }
    } catch (error) {
      console.error("Failed to upload icon:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (slugStatus !== "available") return

    setIsLoading(true)
    try {
      await onSubmit({ name, slug, description, isPublic, icon, settings })
      onOpenChange(false)
      // Reset form
      setName("")
      setSlug("")
      setDescription("")
      setIsPublic(true)
      setIcon(undefined)
      setSettings({
        requirePostApproval: false,
        requireMemberApproval: false,
        allowGuests: true,
        allowImages: true,
        allowVideos: true,
        allowLinks: true,
        minPostLength: 10,
        maxPostLength: 50000,
        primaryColor: "#00bf62",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Forum</DialogTitle>
            <DialogDescription>
              Set up your own community with custom settings and moderation options.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="moderation" className="gap-2">
                <Shield className="h-4 w-4" />
                Moderation
              </TabsTrigger>
              <TabsTrigger value="permissions" className="gap-2">
                <Users className="h-4 w-4" />
                Permissions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Icon Upload */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <AvatarImage src={icon || "/placeholder.svg"} />
                  <AvatarFallback className="bg-muted">
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label>Forum Icon</Label>
                  <p className="text-sm text-muted-foreground">
                    Click to upload an icon for your forum (recommended: 256x256)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleIconUpload}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Forum Name</Label>
                <Input
                  id="name"
                  placeholder="My Awesome Community"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">Forum URL</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">/f/</div>
                  <Input
                    id="slug"
                    placeholder="my-community"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="pl-10 pr-10"
                    required
                    minLength={2}
                    maxLength={30}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {slugStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {slugStatus === "available" && <Check className="h-4 w-4 text-primary" />}
                    {slugStatus === "taken" && <X className="h-4 w-4 text-destructive" />}
                  </div>
                </div>
                {slugStatus === "taken" && <p className="text-sm text-destructive">This URL is already taken</p>}
                {slugStatus === "available" && (
                  <p className="text-sm text-muted-foreground">Your forum will be available at /f/{slug}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell people what your forum is about..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="public">Public Forum</Label>
                  <p className="text-sm text-muted-foreground">Anyone can view and join your forum</p>
                </div>
                <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
              </div>

              {/* Theme Color */}
              <div className="grid gap-2">
                <Label htmlFor="color">Theme Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="color"
                    value={settings.primaryColor || "#00bf62"}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <span className="text-sm text-muted-foreground">Primary color for your forum theme</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-4 mt-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Require Post Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    All posts must be approved by moderators before publishing
                  </p>
                </div>
                <Switch
                  checked={settings.requirePostApproval}
                  onCheckedChange={(checked) => setSettings({ ...settings, requirePostApproval: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Require Member Approval</Label>
                  <p className="text-sm text-muted-foreground">New members must be approved before they can join</p>
                </div>
                <Switch
                  checked={settings.requireMemberApproval}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireMemberApproval: checked })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Minimum Post Length</Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={settings.minPostLength || 10}
                  onChange={(e) => setSettings({ ...settings, minPostLength: Number.parseInt(e.target.value) || 10 })}
                />
                <p className="text-sm text-muted-foreground">Minimum number of characters required for posts</p>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4 mt-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Allow Guest Viewing</Label>
                  <p className="text-sm text-muted-foreground">Non-members can view forum content without joining</p>
                </div>
                <Switch
                  checked={settings.allowGuests}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowGuests: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Allow Images</Label>
                  <p className="text-sm text-muted-foreground">Members can upload and embed images in posts</p>
                </div>
                <Switch
                  checked={settings.allowImages}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowImages: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Allow Videos</Label>
                  <p className="text-sm text-muted-foreground">Members can embed YouTube and other videos</p>
                </div>
                <Switch
                  checked={settings.allowVideos}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowVideos: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Allow Links</Label>
                  <p className="text-sm text-muted-foreground">Members can add external links to posts</p>
                </div>
                <Switch
                  checked={settings.allowLinks}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowLinks: checked })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || slugStatus !== "available"}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Forum"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
