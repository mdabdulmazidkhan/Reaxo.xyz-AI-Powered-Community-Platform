"use client"

import { Users, MessageSquare, Globe, Lock, MoreVertical, ExternalLink, Settings, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Forum } from "@/lib/types"
import { formatDate, formatNumber } from "@/lib/forum-client"
import Link from "next/link"

interface ForumCardProps {
  forum: Forum
  onDelete?: (id: string) => void
}

export function ForumCard({ forum, onDelete }: ForumCardProps) {
  const forumUrl = `/f/${forum.slug}`
  const manageUrl = `/dashboard/forum/${forum.id}`

  return (
    <Card className="group transition-all hover:border-primary/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={forum.icon || "/placeholder.svg"} />
            <AvatarFallback
              className="text-primary font-semibold text-lg"
              style={{ backgroundColor: forum.settings?.primaryColor ? `${forum.settings.primaryColor}20` : undefined }}
            >
              {forum.name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold leading-none">{forum.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">f/{forum.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={forum.isPublic ? "secondary" : "outline"} className="gap-1">
            {forum.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {forum.isPublic ? "Public" : "Private"}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={forumUrl} className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Forum
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={manageUrl} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Manage Forum
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(forum.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {forum.description || "No description provided"}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{formatNumber(forum.memberCount || 0)} members</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{formatNumber(forum.threadCount || 0)} threads</span>
          </div>
          <div className="ml-auto text-xs">Created {formatDate(forum.createdAt)}</div>
        </div>
      </CardContent>
    </Card>
  )
}
