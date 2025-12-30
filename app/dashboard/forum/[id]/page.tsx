"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Settings,
  Users,
  FileText,
  Shield,
  Loader2,
  Check,
  X,
  MoreVertical,
  Crown,
  UserMinus,
} from "lucide-react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import type { Forum, ForumMember, PendingPost } from "@/lib/types"

export default function ForumManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [forum, setForum] = useState<Forum | null>(null)
  const [members, setMembers] = useState<ForumMember[]>([])
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Settings state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [requirePostApproval, setRequirePostApproval] = useState(false)
  const [requireMemberApproval, setRequireMemberApproval] = useState(false)
  const [allowGuests, setAllowGuests] = useState(true)
  const [allowImages, setAllowImages] = useState(true)
  const [allowVideos, setAllowVideos] = useState(true)
  const [allowLinks, setAllowLinks] = useState(true)

  useEffect(() => {
    fetchForumData()
  }, [id])

  const fetchForumData = async () => {
    try {
      const [forumRes, membersRes, pendingRes] = await Promise.all([
        fetch(`/api/forums/${id}`),
        fetch(`/api/forums/${id}/members`),
        fetch(`/api/forums/${id}/pending`),
      ])

      if (forumRes.ok) {
        const forumData = await forumRes.json()
        setForum(forumData)
        setName(forumData.name)
        setDescription(forumData.description || "")
        setIsPublic(forumData.isPublic)
        setRequirePostApproval(forumData.settings?.requirePostApproval || false)
        setRequireMemberApproval(forumData.settings?.requireMemberApproval || false)
        setAllowGuests(forumData.settings?.allowGuests ?? true)
        setAllowImages(forumData.settings?.allowImages ?? true)
        setAllowVideos(forumData.settings?.allowVideos ?? true)
        setAllowLinks(forumData.settings?.allowLinks ?? true)
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json()
        setMembers(membersData.data || [])
      }

      if (pendingRes.ok) {
        const pendingData = await pendingRes.json()
        setPendingPosts(pendingData.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch forum data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      await fetch(`/api/forums/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          isPublic,
          settings: {
            requirePostApproval,
            requireMemberApproval,
            allowGuests,
            allowImages,
            allowVideos,
            allowLinks,
          },
        }),
      })
      await fetchForumData()
    } finally {
      setIsSaving(false)
    }
  }

  const handleApprovePost = async (postId: string) => {
    await fetch(`/api/forums/${id}/pending/${postId}/approve`, { method: "POST" })
    await fetchForumData()
  }

  const handleRejectPost = async (postId: string) => {
    await fetch(`/api/forums/${id}/pending/${postId}/reject`, { method: "POST" })
    await fetchForumData()
  }

  const handleUpdateMemberRole = async (userId: string, role: ForumMember["role"]) => {
    await fetch(`/api/forums/${id}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    await fetchForumData()
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return
    await fetch(`/api/forums/${id}/members/${userId}`, { method: "DELETE" })
    await fetchForumData()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!forum) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
          <h1 className="text-2xl font-bold">Forum not found</h1>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  const getRoleBadgeColor = (role: ForumMember["role"]) => {
    switch (role) {
      case "owner":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "admin":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "moderator":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={forum.icon || "/placeholder.svg"} />
              <AvatarFallback>{forum.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{forum.name}</h1>
              <p className="text-muted-foreground">f/{forum.slug}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <FileText className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="moderation" className="gap-2">
              <Shield className="h-4 w-4" />
              Moderation
              {pendingPosts.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                  {pendingPosts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Members</CardDescription>
                  <CardTitle className="text-3xl">{forum.memberCount || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Threads</CardDescription>
                  <CardTitle className="text-3xl">{forum.threadCount || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Pending Posts</CardDescription>
                  <CardTitle className="text-3xl">{pendingPosts.length}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks for managing your forum</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="justify-start gap-2 bg-transparent" asChild>
                  <Link href={`/f/${forum.slug}`}>
                    <FileText className="h-4 w-4" />
                    View Forum
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start gap-2 bg-transparent" onClick={() => {}}>
                  <Users className="h-4 w-4" />
                  Invite Members
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation">
            <Card>
              <CardHeader>
                <CardTitle>Pending Posts</CardTitle>
                <CardDescription>Review and approve posts before they go live</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingPosts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending posts to review</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPosts.map((post) => (
                      <div key={post.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={post.authorAvatar || "/placeholder.svg"} />
                            <AvatarFallback>{post.authorName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{post.authorName}</span>
                              <Badge variant="outline">{post.type}</Badge>
                            </div>
                            {post.title && <h4 className="font-semibold mt-1">{post.title}</h4>}
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {post.body.replace(/<[^>]*>/g, "")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(post.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-primary bg-transparent"
                            onClick={() => handleApprovePost(post.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive bg-transparent"
                            onClick={() => handleRejectPost(post.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Members ({members.length})</CardTitle>
                <CardDescription>Manage forum members and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">User {member.userId.slice(0, 8)}</span>
                            <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                              {member.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {member.role !== "owner" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.userId, "admin")}>
                              <Crown className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.userId, "moderator")}>
                              <Shield className="h-4 w-4 mr-2" />
                              Make Moderator
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.userId, "member")}>
                              <Users className="h-4 w-4 mr-2" />
                              Set as Member
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRemoveMember(member.userId)}
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Basic forum information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Forum Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Public Forum</Label>
                      <p className="text-sm text-muted-foreground">Anyone can view and join</p>
                    </div>
                    <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Moderation Settings</CardTitle>
                  <CardDescription>Control how content is moderated</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Post Approval</Label>
                      <p className="text-sm text-muted-foreground">Posts must be approved before publishing</p>
                    </div>
                    <Switch checked={requirePostApproval} onCheckedChange={setRequirePostApproval} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Member Approval</Label>
                      <p className="text-sm text-muted-foreground">New members must be approved to join</p>
                    </div>
                    <Switch checked={requireMemberApproval} onCheckedChange={setRequireMemberApproval} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Permissions</CardTitle>
                  <CardDescription>Control what members can post</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Guest Viewing</Label>
                      <p className="text-sm text-muted-foreground">Non-members can view content</p>
                    </div>
                    <Switch checked={allowGuests} onCheckedChange={setAllowGuests} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Images</Label>
                      <p className="text-sm text-muted-foreground">Members can upload images</p>
                    </div>
                    <Switch checked={allowImages} onCheckedChange={setAllowImages} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Videos</Label>
                      <p className="text-sm text-muted-foreground">Members can embed videos</p>
                    </div>
                    <Switch checked={allowVideos} onCheckedChange={setAllowVideos} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Links</Label>
                      <p className="text-sm text-muted-foreground">Members can add external links</p>
                    </div>
                    <Switch checked={allowLinks} onCheckedChange={setAllowLinks} />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
