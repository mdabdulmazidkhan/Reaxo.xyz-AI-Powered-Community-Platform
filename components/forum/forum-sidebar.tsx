"use client"

import { Users, TrendingUp, Clock, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Forum } from "@/lib/types"

interface ForumSidebarProps {
  forum: Forum
}

export function ForumSidebar({ forum }: ForumSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-20 space-y-4">
        {/* Forum Info */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            {forum.icon ? (
              <Avatar className="h-12 w-12">
                <AvatarImage src={forum.icon || "/placeholder.svg"} alt={forum.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                  {forum.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xl">
                {forum.name[0].toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-semibold">{forum.name}</h3>
              <p className="text-xs text-muted-foreground">f/{forum.slug}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{forum.description || "No description"}</p>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="font-semibold">{forum.memberCount || 1}</span>
              <span className="text-muted-foreground ml-1">members</span>
            </div>
            <div>
              <span className="font-semibold">{forum.threadCount || 0}</span>
              <span className="text-muted-foreground ml-1">threads</span>
            </div>
          </div>
        </div>

        {/* Quick Links - removed hardcoded categories */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold mb-3">Quick Links</h3>
          <nav className="space-y-1">
            <Button variant="ghost" className="w-full justify-start gap-3 h-9">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>All Threads</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-9">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span>Trending</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-9">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Recent</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-9">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Members</span>
            </Button>
          </nav>
        </div>
      </div>
    </aside>
  )
}
